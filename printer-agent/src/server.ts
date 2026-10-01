import { createServer as createHttpServer, type IncomingMessage, type Server, type ServerResponse } from 'node:http';
import { isCodepage } from './codepages.ts';
import type { ConfigStore } from './config.ts';
import type { PrintService } from './printService.ts';
import { ValidationError, parsePrintRequest } from './validate.ts';

const MAX_BODY_BYTES = 64 * 1024;
/** Limite de impressões por minuto (protege o papel se algo sair do controle). */
const PRINTS_PER_MINUTE = 30;

type Log = (message: string) => void;

class HttpError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

function readJson(req: IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const type = String(req.headers['content-type'] ?? '');
    // Exigir JSON obriga o navegador a pedir permissão antes (preflight): um site
    // qualquer não consegue disparar a impressão com um <form> escondido.
    if (!/^application\/json\b/i.test(type)) {
      reject(new HttpError(415, 'INVALID_PAYLOAD', 'Envie o corpo como application/json.'));
      req.resume();
      return;
    }
    const chunks: Buffer[] = [];
    let size = 0;
    req.on('data', (chunk: Buffer) => {
      size += chunk.length;
      if (size > MAX_BODY_BYTES) {
        reject(new HttpError(413, 'INVALID_PAYLOAD', 'Comanda grande demais.'));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => {
      if (size > MAX_BODY_BYTES) return;
      try {
        resolve(chunks.length ? JSON.parse(Buffer.concat(chunks).toString('utf8')) : {});
      } catch {
        reject(new HttpError(400, 'INVALID_PAYLOAD', 'JSON inválido.'));
      }
    });
    req.on('error', reject);
  });
}

export function createAgentServer(options: { service: PrintService; config: ConfigStore; log: Log }): Server {
  const { service, config, log } = options;
  const recentPrints: number[] = [];

  const allowedHosts = () => {
    const { port } = config.get();
    return new Set([`127.0.0.1:${port}`, `localhost:${port}`, `[::1]:${port}`]);
  };

  const send = (res: ServerResponse, status: number, body: unknown) => {
    res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
    res.end(JSON.stringify(body));
  };

  const checkRate = () => {
    const now = Date.now();
    while (recentPrints.length && now - recentPrints[0] > 60_000) recentPrints.shift();
    if (recentPrints.length >= PRINTS_PER_MINUTE) {
      throw new HttpError(429, 'RATE_LIMITED', 'Muitas impressões seguidas. Aguarde um minuto.');
    }
    recentPrints.push(now);
  };

  const handle = async (req: IncomingMessage, res: ServerResponse) => {
    // Nome do host: barra "DNS rebinding" (site externo apontando o próprio domínio para 127.0.0.1).
    if (!allowedHosts().has(String(req.headers.host ?? '').toLowerCase())) {
      throw new HttpError(403, 'FORBIDDEN_HOST', 'Acesso permitido só por localhost.');
    }

    // Origem: navegadores sempre mandam em pedidos de outro site. Fora da lista = recusado.
    const origin = req.headers.origin;
    if (origin !== undefined) {
      if (!config.get().allowedOrigins.includes(origin.replace(/\/+$/, ''))) {
        log(`Recusado: origem não autorizada ${origin} (${req.method} ${req.url})`);
        throw new HttpError(403, 'FORBIDDEN_ORIGIN', 'Este site não pode usar a impressora.');
      }
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Vary', 'Origin');
    }

    if (req.method === 'OPTIONS') {
      if (origin === undefined) throw new HttpError(403, 'FORBIDDEN_ORIGIN', 'Pré-verificação sem origem.');
      res.writeHead(204, {
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Max-Age': '600',
        // Chrome: site público acessando a rede local precisa desta confirmação.
        ...(req.headers['access-control-request-private-network'] ? { 'Access-Control-Allow-Private-Network': 'true' } : {}),
      });
      res.end();
      return;
    }

    const path = new URL(req.url ?? '/', 'http://localhost').pathname;
    const route = `${req.method} ${path}`;

    if (route === 'GET /health') return send(res, 200, await service.health());

    if (route === 'GET /printers') {
      const printers = await service.listPrinters(0);
      return send(res, 200, { printers, selected: config.get().printerName });
    }

    if (route === 'POST /config') {
      const body = (await readJson(req)) as Record<string, unknown>;
      const patch: { printerName?: string; codepage?: ReturnType<ConfigStore['get']>['codepage'] } = {};
      if (body.printerName !== undefined) {
        if (typeof body.printerName !== 'string' || body.printerName.length > 200) {
          throw new HttpError(400, 'INVALID_PAYLOAD', 'Nome de impressora inválido.');
        }
        const printers = await service.listPrinters(0);
        if (body.printerName && !printers.some((printer) => printer.name === body.printerName)) {
          throw new HttpError(400, 'PRINTER_NOT_FOUND', 'Essa impressora não está instalada no Windows.');
        }
        patch.printerName = body.printerName;
      }
      if (body.codepage !== undefined) {
        if (!isCodepage(body.codepage)) throw new HttpError(400, 'INVALID_PAYLOAD', 'Tabela de acentos inválida.');
        patch.codepage = body.codepage;
      }
      const saved = config.update(patch);
      log(`Configuração salva: impressora "${saved.printerName || 'automática'}", acentos ${saved.codepage}.`);
      return send(res, 200, { ok: true, printerName: saved.printerName, codepage: saved.codepage });
    }

    if (route === 'POST /print') {
      let request;
      try {
        request = parsePrintRequest(await readJson(req));
      } catch (error) {
        if (error instanceof ValidationError) throw new HttpError(400, 'INVALID_PAYLOAD', error.message);
        throw error;
      }
      checkRate();
      const outcome = await service.printOrder(request);
      return send(res, outcome.ok ? 200 : 503, outcome);
    }

    if (route === 'POST /test') {
      await readJson(req);
      checkRate();
      const outcome = await service.printTest();
      return send(res, outcome.ok ? 200 : 503, outcome);
    }

    throw new HttpError(404, 'NOT_FOUND', 'Rota não encontrada.');
  };

  return createHttpServer((req, res) => {
    handle(req, res).catch((error: unknown) => {
      if (res.headersSent) return res.end();
      if (error instanceof HttpError) return send(res, error.status, { ok: false, code: error.code, message: error.message });
      log(`Erro inesperado em ${req.method} ${req.url}: ${error instanceof Error ? error.stack : String(error)}`);
      send(res, 500, { ok: false, code: 'AGENT_ERROR', message: 'Erro interno do agente.' });
    });
  });
}
