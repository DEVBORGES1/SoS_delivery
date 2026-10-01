import { buildOrderTicket, buildTestTicket } from './comanda.ts';
import type { ConfigStore } from './config.ts';
import type { TicketDocument } from './escpos.ts';
import { PrintJournal } from './journal.ts';
import { ERROR_MESSAGES, PrintError, looksLikeThermal, type PrintErrorCode, type PrinterDriver, type PrinterInfo } from './printers/types.ts';
import type { PrintRequest } from './validate.ts';

export const AGENT_VERSION = '1.0.0';

export type PrinterConnection = 'connected' | 'disconnected' | 'not_found' | 'not_configured';

export interface HealthReport {
  status: 'ok';
  agent: 'sos-impressora';
  version: string;
  printer: PrinterConnection;
  printerName: string;
  /** Impressora escolhida sozinha (nenhuma foi selecionada ainda). */
  autoDetected: boolean;
  code: PrintErrorCode | null;
  message: string;
  windowsStatus: string;
  paperWidthMm: number;
  columns: number;
  codepage: string;
  simulated: boolean;
  checkedAt: number;
}

export type PrintOutcome =
  | { ok: true; printerName: string; alreadyPrinted: boolean }
  | { ok: false; code: PrintErrorCode; message: string };

type Log = (message: string) => void;

/** Impressora que o agente vai usar: a configurada ou, sem configuração, a primeira térmica encontrada. */
export function resolvePrinter(
  printers: PrinterInfo[],
  configured: string,
): { printer: PrinterInfo; autoDetected: boolean } | { error: PrintErrorCode } {
  if (configured) {
    const printer = printers.find((item) => item.name.toLowerCase() === configured.toLowerCase());
    return printer ? { printer, autoDetected: false } : { error: 'PRINTER_NOT_FOUND' };
  }
  const thermal = printers.filter(looksLikeThermal);
  const printer = thermal.find((item) => item.ready) ?? thermal[0];
  return printer ? { printer, autoDetected: true } : { error: 'PRINTER_NOT_CONFIGURED' };
}

export class PrintService {
  private readonly driver: PrinterDriver;
  private readonly config: ConfigStore;
  private readonly journal: PrintJournal;
  private readonly log: Log;
  /** Uma impressão por vez: dois pedidos aceitos juntos saem um depois do outro. */
  private tail: Promise<unknown> = Promise.resolve();
  /** Mesmo pedido pedido duas vezes ao mesmo tempo: as duas chamadas recebem o mesmo resultado. */
  private readonly inFlight = new Map<string, Promise<PrintOutcome>>();
  private cache: { at: number; printers: PrinterInfo[] } | null = null;
  private readonly statusCacheMs: number;

  constructor(options: { driver: PrinterDriver; config: ConfigStore; dataDir: string; log: Log; statusCacheMs?: number }) {
    this.statusCacheMs = options.statusCacheMs ?? 3_000;
    this.driver = options.driver;
    this.config = options.config;
    this.journal = new PrintJournal(options.dataDir);
    this.log = options.log;
  }

  /** Lista do Windows, guardada por alguns segundos (o painel consulta o status sempre). */
  async listPrinters(maxAgeMs = this.statusCacheMs): Promise<PrinterInfo[]> {
    if (this.cache && Date.now() - this.cache.at < maxAgeMs) return this.cache.printers;
    const printers = await this.driver.list();
    this.cache = { at: Date.now(), printers };
    return printers;
  }

  async health(): Promise<HealthReport> {
    const config = this.config.get();
    const base = {
      status: 'ok' as const,
      agent: 'sos-impressora' as const,
      version: AGENT_VERSION,
      paperWidthMm: config.paperWidthMm,
      columns: config.columns,
      codepage: config.codepage,
      simulated: this.driver.simulated,
      checkedAt: Date.now(),
    };
    let printers: PrinterInfo[];
    try {
      printers = await this.listPrinters();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return { ...base, printer: 'disconnected', printerName: config.printerName, autoDetected: false, code: 'SPOOLER_ERROR', message, windowsStatus: '' };
    }
    const resolved = resolvePrinter(printers, config.printerName);
    if ('error' in resolved) {
      return {
        ...base,
        printer: resolved.error === 'PRINTER_NOT_FOUND' ? 'not_found' : 'not_configured',
        printerName: config.printerName,
        autoDetected: false,
        code: resolved.error,
        message: ERROR_MESSAGES[resolved.error],
        windowsStatus: '',
      };
    }
    const { printer, autoDetected } = resolved;
    return {
      ...base,
      printer: printer.ready ? 'connected' : 'disconnected',
      printerName: printer.name,
      autoDetected,
      code: printer.problem,
      message: printer.problem ? ERROR_MESSAGES[printer.problem] : 'Impressora pronta.',
      windowsStatus: printer.status,
    };
  }

  printOrder(request: PrintRequest): Promise<PrintOutcome> {
    const key = PrintJournal.key(request.orderId, request.ticket.createdAt);
    if (!request.reprint && this.journal.printedAt(key)) {
      this.log(`Pedido #${request.orderId}: já impresso antes, ignorado (sem reimpressão).`);
      return Promise.resolve({ ok: true, printerName: this.config.get().printerName, alreadyPrinted: true });
    }
    const running = this.inFlight.get(key);
    if (running) return running;

    const outcome = this.enqueue(async () => {
      // Pode ter saído enquanto esperava na fila.
      if (!request.reprint && this.journal.printedAt(key)) {
        return { ok: true as const, printerName: this.config.get().printerName, alreadyPrinted: true };
      }
      const config = this.config.get();
      const doc = buildOrderTicket(request.ticket, { columns: config.columns, codepage: config.codepage, reprint: request.reprint });
      const printerName = await this.send(doc, `Pedido ${request.orderId}${request.reprint ? ' (2a via)' : ''}`);
      this.journal.add(key);
      return { ok: true as const, printerName, alreadyPrinted: false };
    }, `Pedido #${request.orderId}${request.reprint ? ' (2ª via)' : ''}`);

    this.inFlight.set(key, outcome);
    void outcome.finally(() => this.inFlight.delete(key));
    return outcome;
  }

  printTest(): Promise<PrintOutcome> {
    return this.enqueue(async () => {
      const config = this.config.get();
      const printerName = await this.send(
        (name) => buildTestTicket(name, { columns: config.columns, codepage: config.codepage }),
        'Teste de impressao',
      );
      return { ok: true as const, printerName, alreadyPrinted: false };
    }, 'Teste de impressão');
  }

  /** Confere a impressora na hora (sem cache: ela pode ter acabado de ser ligada) e só então manda os bytes. */
  private async send(build: TicketDocument | ((printerName: string) => TicketDocument), documentName: string): Promise<string> {
    const config = this.config.get();
    const printers = await this.listPrinters(0);
    const resolved = resolvePrinter(printers, config.printerName);
    if ('error' in resolved) throw new PrintError(resolved.error);
    const { printer } = resolved;
    if (printer.problem) throw new PrintError(printer.problem);
    const doc = typeof build === 'function' ? build(printer.name) : build;
    await this.driver.print(printer.name, doc.toEscPos({ feedLines: config.feedLines, cut: config.cut }), documentName, config.jobTimeoutMs);
    this.cache = null;
    return printer.name;
  }

  private enqueue(task: () => Promise<PrintOutcome>, label: string): Promise<PrintOutcome> {
    const run = async (): Promise<PrintOutcome> => {
      const started = Date.now();
      try {
        const result = await task();
        this.log(`${label}: ${result.ok && result.alreadyPrinted ? 'já estava impresso' : 'impresso'} (${Date.now() - started} ms).`);
        return result;
      } catch (error) {
        this.cache = null;
        const failure =
          error instanceof PrintError
            ? { ok: false as const, code: error.code, message: error.message }
            : { ok: false as const, code: 'SPOOLER_ERROR' as const, message: error instanceof Error ? error.message : String(error) };
        this.log(`${label}: FALHOU — ${failure.message}`);
        return failure;
      }
    };
    const result = this.tail.then(run, run);
    this.tail = result;
    return result;
  }
}
