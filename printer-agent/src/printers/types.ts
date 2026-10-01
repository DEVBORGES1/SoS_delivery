/** Motivos de falha que o painel sabe explicar ao lojista. */
export type PrintErrorCode =
  | 'PRINTER_NOT_CONFIGURED'
  | 'PRINTER_NOT_FOUND'
  | 'PRINTER_OFFLINE'
  | 'PRINTER_PAUSED'
  | 'PAPER_OUT'
  | 'PRINTER_ERROR'
  | 'PRINT_TIMEOUT'
  | 'DRIVER_ERROR'
  | 'SPOOLER_ERROR';

export const ERROR_MESSAGES: Record<PrintErrorCode, string> = {
  PRINTER_NOT_CONFIGURED: 'Nenhuma impressora selecionada no agente.',
  PRINTER_NOT_FOUND: 'Impressora não encontrada no Windows.',
  PRINTER_OFFLINE: 'Impressora desligada ou cabo USB desconectado.',
  PRINTER_PAUSED: 'Impressora pausada no Windows.',
  PAPER_OUT: 'Impressora sem papel.',
  PRINTER_ERROR: 'A impressora informou um erro (tampa aberta ou papel preso?).',
  PRINT_TIMEOUT: 'A impressora não respondeu (verifique se está ligada e o cabo USB).',
  DRIVER_ERROR: 'O driver da impressora recusou a impressão direta (RAW).',
  SPOOLER_ERROR: 'Erro do Windows ao enviar a impressão.',
};

export class PrintError extends Error {
  readonly code: PrintErrorCode;

  constructor(code: PrintErrorCode, message: string = ERROR_MESSAGES[code]) {
    super(message);
    this.code = code;
  }
}

export interface PrinterInfo {
  name: string;
  driver: string;
  port: string;
  isDefault: boolean;
  /** Pronta para imprimir, até onde o Windows sabe. */
  ready: boolean;
  /** Status bruto do Windows (ex.: "Normal", "Offline"), para diagnóstico. */
  status: string;
  /** Motivo quando não está pronta. */
  problem: PrintErrorCode | null;
}

export interface PrinterDriver {
  readonly simulated: boolean;
  list(): Promise<PrinterInfo[]>;
  /** Envia os bytes e só resolve quando a impressora recebeu tudo. Lança `PrintError`. */
  print(printerName: string, data: Buffer, documentName: string, timeoutMs: number): Promise<void>;
}

/** Nome típico das térmicas 58/80mm, para achar a impressora sozinho na primeira vez. */
export function looksLikeThermal(printer: Pick<PrinterInfo, 'name' | 'driver'>): boolean {
  return /pos|58|80mm|thermal|t[eé]rmica|receipt|cupom|esc\/?pos|xprinter|goojprt|knup|elgin|bematech|epson tm/i.test(
    `${printer.name} ${printer.driver}`,
  );
}
