import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { request as httpRequest, type Server } from 'node:http';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { after, before, beforeEach, describe, it } from 'node:test';
import { ConfigStore } from '../src/config.ts';
import { PrintService } from '../src/printService.ts';
import { SimulatedPrinterDriver, type SimulatedState } from '../src/printers/simulated.ts';
import { createAgentServer } from '../src/server.ts';
import { deliveryTicket, pickupTicket } from './fixtures.ts';

const SITE = 'https://so-s-delivery.vercel.app';
const PRINTER = 'POS-58 (simulada)';

let dir: string;
let server: Server;
let driver: SimulatedPrinterDriver;
let base: string;
let port: number;

async function call(path: string, init: { method?: string; body?: unknown; origin?: string | null } = {}) {
  const headers: Record<string, string> = {};
  if (init.origin !== null) headers.Origin = init.origin ?? SITE;
  if (init.body !== undefined) headers['Content-Type'] = 'application/json';
  const response = await fetch(`${base}${path}`, {
    method: init.method ?? (init.body !== undefined ? 'POST' : 'GET'),
    headers,
    body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
  });
  return { status: response.status, headers: response.headers, body: (await response.json().catch(() => null)) as Record<string, unknown> };
}

const printBody = (ticket = deliveryTicket(), reprint = false) => ({ orderId: ticket.orderId, reprint, ticket });

async function setState(estado: SimulatedState) {
  await driver.write({ estado });
}

before(async () => {
  dir = mkdtempSync(join(tmpdir(), 'sos-agente-teste-'));
  port = 40_000 + Math.floor(Math.random() * 10_000);
  writeFileSync(join(dir, 'config.json'), JSON.stringify({ port, printerName: PRINTER, jobTimeoutMs: 3_000 }));
  const config = new ConfigStore(dir);
  driver = new SimulatedPrinterDriver(dir, () => config.get().codepage);
  await driver.write({ impressora: PRINTER, estado: 'online', demoraMs: 150 });
  const service = new PrintService({ driver, config, dataDir: dir, log: () => {}, statusCacheMs: 0 });
  server = createAgentServer({ service, config, log: () => {} });
  await new Promise<void>((resolve) => server.listen(port, '127.0.0.1', resolve));
  base = `http://127.0.0.1:${port}`;
});

after(() => {
  server.close();
  rmSync(dir, { recursive: true, force: true });
});

beforeEach(async () => {
  await setState('online');
});

describe('segurança', () => {
  it('recusa site que não está na lista', async () => {
    const response = await call('/print', { body: printBody(), origin: 'https://site-malicioso.com' });
    assert.equal(response.status, 403);
    assert.equal(response.body.code, 'FORBIDDEN_ORIGIN');
  });

  it('pré-verificação do navegador: libera o site da loja (com rede local do Chrome) e barra os outros', async () => {
    const ok = await fetch(`${base}/print`, {
      method: 'OPTIONS',
      headers: { Origin: SITE, 'Access-Control-Request-Method': 'POST', 'Access-Control-Request-Private-Network': 'true' },
    });
    assert.equal(ok.status, 204);
    assert.equal(ok.headers.get('access-control-allow-origin'), SITE);
    assert.equal(ok.headers.get('access-control-allow-private-network'), 'true');

    const evil = await fetch(`${base}/print`, { method: 'OPTIONS', headers: { Origin: 'https://evil.example' } });
    assert.equal(evil.status, 403);
  });

  it('recusa Host diferente de localhost (DNS rebinding)', async () => {
    const status = await new Promise<number>((resolve, reject) => {
      const req = httpRequest({ host: '127.0.0.1', port, path: '/health', headers: { Host: `ataque.com:${port}` } }, (res) => {
        res.resume();
        resolve(res.statusCode ?? 0);
      });
      req.on('error', reject);
      req.end();
    });
    assert.equal(status, 403);
  });

  it('exige JSON (um <form> escondido não consegue imprimir)', async () => {
    const response = await fetch(`${base}/test`, {
      method: 'POST',
      headers: { Origin: SITE, 'Content-Type': 'application/x-www-form-urlencoded' },
      body: 'a=1',
    });
    assert.equal(response.status, 415);
  });

  it('recusa comanda fora do formato', async () => {
    const response = await call('/print', { body: { orderId: 1, content: '\x1b@texto livre' } });
    assert.equal(response.status, 400);
    assert.equal(response.body.code, 'INVALID_PAYLOAD');
  });
});

describe('status', () => {
  it('GET /health com a impressora ligada', async () => {
    const { status, body } = await call('/health');
    assert.equal(status, 200);
    assert.equal(body.status, 'ok');
    assert.equal(body.printer, 'connected');
    assert.equal(body.printerName, PRINTER);
    assert.equal(body.paperWidthMm, 58);
  });

  it('impressora desligada / cabo desconectado aparece como desconectada', async () => {
    await setState('desligada');
    const { body } = await call('/health');
    assert.equal(body.printer, 'disconnected');
    assert.equal(body.code, 'PRINTER_OFFLINE');
  });

  it('impressora removida do Windows aparece como não encontrada', async () => {
    await setState('removida');
    const { body } = await call('/health');
    assert.equal(body.printer, 'not_found');
  });
});

describe('impressão', () => {
  it('imprime a comanda e não repete sem pedido de reimpressão', async () => {
    const before = driver.printed.length;
    const ticket = deliveryTicket({ orderId: 2001 });
    const first = await call('/print', { body: printBody(ticket) });
    assert.equal(first.status, 200, JSON.stringify(first.body));
    assert.equal(first.body.ok, true);
    assert.equal(first.body.alreadyPrinted, false);

    const again = await call('/print', { body: printBody(ticket) });
    assert.equal(again.body.ok, true);
    assert.equal(again.body.alreadyPrinted, true);
    assert.equal(driver.printed.length, before + 1, 'só uma comanda saiu');
  });

  it('duplo clique (dois pedidos iguais ao mesmo tempo) imprime uma vez só', async () => {
    const before = driver.printed.length;
    const ticket = deliveryTicket({ orderId: 2002 });
    const results = await Promise.all([call('/print', { body: printBody(ticket) }), call('/print', { body: printBody(ticket) })]);
    assert.ok(results.every((result) => result.body.ok === true));
    assert.equal(driver.printed.length, before + 1);
  });

  it('dois pedidos chegando juntos saem os dois, um depois do outro', async () => {
    const before = driver.printed.length;
    const [a, b] = await Promise.all([
      call('/print', { body: printBody(deliveryTicket({ orderId: 2003 })) }),
      call('/print', { body: printBody(pickupTicket({ orderId: 2004 })) }),
    ]);
    assert.equal(a.body.ok, true);
    assert.equal(b.body.ok, true);
    const names = driver.printed.slice(before).map((item) => item.documentName);
    assert.deepEqual(names, ['Pedido 2003', 'Pedido 2004']);
  });

  it('reimpressão pedida pelo lojista sai marcada como 2ª via', async () => {
    const ticket = deliveryTicket({ orderId: 2005 });
    await call('/print', { body: printBody(ticket) });
    const before = driver.printed.length;
    const reprint = await call('/print', { body: printBody(ticket, true) });
    assert.equal(reprint.body.ok, true);
    assert.equal(driver.printed.length, before + 1);
    assert.match(driver.printed.at(-1)?.text ?? '', /2ª VIA - REIMPRESSÃO/);
  });

  it('impressora desligada: falha com motivo e imprime quando volta', async () => {
    const ticket = deliveryTicket({ orderId: 2006 });
    await setState('desligada');
    const failed = await call('/print', { body: printBody(ticket) });
    assert.equal(failed.status, 503);
    assert.equal(failed.body.ok, false);
    assert.equal(failed.body.code, 'PRINTER_OFFLINE');

    await setState('online');
    const retry = await call('/print', { body: printBody(ticket) });
    assert.equal(retry.body.ok, true);
    assert.equal(retry.body.alreadyPrinted, false, 'a tentativa que falhou não conta como impressa');
  });

  it('sem papel', async () => {
    await setState('sem-papel');
    const result = await call('/print', { body: printBody(deliveryTicket({ orderId: 2007 })) });
    assert.equal(result.body.code, 'PAPER_OUT');
  });

  it('impressora que não responde (fila travada) dá erro de comunicação', async () => {
    await setState('travada');
    const result = await call('/print', { body: printBody(deliveryTicket({ orderId: 2008 })) });
    assert.equal(result.body.code, 'PRINT_TIMEOUT');
  });

  it('impressora não encontrada', async () => {
    await setState('removida');
    const result = await call('/print', { body: printBody(deliveryTicket({ orderId: 2009 })) });
    assert.equal(result.body.code, 'PRINTER_NOT_FOUND');
  });

  it('página de teste', async () => {
    const result = await call('/test', { body: {} });
    assert.equal(result.body.ok, true);
    assert.match(driver.printed.at(-1)?.text ?? '', /TESTE DE IMPRESSÃO/);
  });

  it('troca a tabela de acentos pelo painel e recusa impressora que não existe', async () => {
    const ok = await call('/config', { body: { codepage: 'cp860' } });
    assert.equal(ok.body.codepage, 'cp860');
    const bad = await call('/config', { body: { printerName: 'Impressora Fantasma' } });
    assert.equal(bad.status, 400);
    await call('/config', { body: { codepage: 'cp850' } });
  });
});
