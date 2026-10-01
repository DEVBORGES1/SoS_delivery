import { appendFileSync, mkdirSync, renameSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { createInterface } from 'node:readline';
import { ConfigStore } from './config.ts';
import { AGENT_VERSION, PrintService } from './printService.ts';
import { SimulatedPrinterDriver } from './printers/simulated.ts';
import type { PrinterDriver } from './printers/types.ts';
import { WindowsPrinterDriver } from './printers/windows.ts';
import { createAgentServer } from './server.ts';

/** Rodando como .exe (Node SEA)? Então os arquivos ficam ao lado do executável. */
function isExecutable(): boolean {
  try {
    const sea = process.getBuiltinModule('node:sea') as { isSea?: () => boolean } | undefined;
    return sea?.isSea?.() === true;
  } catch {
    return false;
  }
}

const packaged = isExecutable();
const dataDir = resolve(process.env.SOS_AGENT_DIR ?? (packaged ? dirname(process.execPath) : process.cwd()));
mkdirSync(dataDir, { recursive: true });
const logFile = join(dataDir, 'agente.log');

function log(message: string) {
  const now = new Date();
  const line = `[${now.toLocaleDateString('pt-BR')} ${now.toLocaleTimeString('pt-BR')}] ${message}`;
  console.log(line);
  try {
    if ((statSync(logFile, { throwIfNoEntry: false })?.size ?? 0) > 1_000_000) renameSync(logFile, `${logFile}.1`);
    appendFileSync(logFile, `${line}\n`);
  } catch {
    // Log em arquivo é só para diagnóstico: nunca derruba o agente.
  }
}

/** No .exe aberto com duplo clique, segura a janela para o lojista ler o erro antes de fechar. */
function fatal(message: string) {
  log(message);
  if (packaged && process.stdin.isTTY) {
    console.log('\nPressione Enter para fechar.');
    createInterface({ input: process.stdin }).once('line', () => process.exit(1));
  } else {
    process.exit(1);
  }
}

function start() {
  const simulate = process.argv.includes('--simular');
  const config = new ConfigStore(dataDir);
  let driver: PrinterDriver;
  if (simulate) driver = new SimulatedPrinterDriver(dataDir, () => config.get().codepage);
  else if (process.platform === 'win32') driver = new WindowsPrinterDriver();
  else return fatal('O agente imprime pelo Windows. Em outro sistema, use --simular para testar.');

  const service = new PrintService({ driver, config, dataDir, log });
  const server = createAgentServer({ service, config, log });
  const { port } = config.get();

  server.on('error', (error: NodeJS.ErrnoException) => {
    fatal(
      error.code === 'EADDRINUSE'
        ? `A porta ${port} já está em uso: o agente provavelmente já está aberto em outra janela.`
        : `Não foi possível iniciar: ${error.message}`,
    );
  });

  // Só no próprio computador: nada da rede (nem da internet) chega a esta porta.
  server.listen(port, '127.0.0.1', async () => {
    log(`Agente de impressão S.O.S v${AGENT_VERSION}${simulate ? ' (MODO SIMULAÇÃO)' : ''}`);
    log(`Ouvindo em http://127.0.0.1:${port} — pasta: ${dataDir}`);
    const health = await service.health();
    log(
      health.printer === 'connected'
        ? `Impressora: ${health.printerName}${health.autoDetected ? ' (encontrada sozinha)' : ''} — pronta.`
        : `Impressora: ${health.printerName || '(nenhuma)'} — ${health.message}`,
    );
    log('Deixe esta janela aberta enquanto a loja estiver recebendo pedidos.');
  });

  const shutdown = () => {
    log('Agente encerrado.');
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(0), 2_000).unref();
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

start();
