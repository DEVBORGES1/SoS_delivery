import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { isCodepage, type Codepage } from './codepages.ts';

export interface AgentConfig {
  /** Porta local (só 127.0.0.1). */
  port: number;
  /** Nome da impressora no Windows. Vazio = procura sozinho uma térmica instalada. */
  printerName: string;
  /** Tabela de acentos. Se sair letra estranha no teste, troque pelo painel. */
  codepage: Codepage;
  /** Sites que podem mandar imprimir. Qualquer outro recebe 403. */
  allowedOrigins: string[];
  /** 32 colunas no papel de 58mm (48 no de 80mm). */
  columns: number;
  /** Largura do papel, só para exibição no painel. */
  paperWidthMm: number;
  /** Manda o comando de corte (ignorado por impressoras sem guilhotina). */
  cut: boolean;
  /** Linhas em branco no fim, para a comanda passar da serrilha. */
  feedLines: number;
  /** Tempo máximo esperando a impressora receber a comanda. */
  jobTimeoutMs: number;
}

export const DEFAULT_CONFIG: AgentConfig = {
  port: 3333,
  printerName: '',
  codepage: 'cp850',
  allowedOrigins: [
    'https://so-s-delivery.vercel.app',
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:4173',
    'http://127.0.0.1:4173',
  ],
  columns: 32,
  paperWidthMm: 58,
  cut: true,
  feedLines: 4,
  jobTimeoutMs: 15_000,
};

function sanitize(raw: Partial<AgentConfig>): AgentConfig {
  const number = (value: unknown, fallback: number, min: number, max: number) =>
    typeof value === 'number' && Number.isInteger(value) && value >= min && value <= max ? value : fallback;
  return {
    port: number(raw.port, DEFAULT_CONFIG.port, 1024, 65535),
    printerName: typeof raw.printerName === 'string' ? raw.printerName.trim() : '',
    codepage: isCodepage(raw.codepage) ? raw.codepage : DEFAULT_CONFIG.codepage,
    allowedOrigins: Array.isArray(raw.allowedOrigins)
      ? raw.allowedOrigins.filter((origin): origin is string => typeof origin === 'string').map((origin) => origin.replace(/\/+$/, ''))
      : DEFAULT_CONFIG.allowedOrigins,
    columns: number(raw.columns, DEFAULT_CONFIG.columns, 24, 64),
    paperWidthMm: number(raw.paperWidthMm, DEFAULT_CONFIG.paperWidthMm, 40, 120),
    cut: typeof raw.cut === 'boolean' ? raw.cut : DEFAULT_CONFIG.cut,
    feedLines: number(raw.feedLines, DEFAULT_CONFIG.feedLines, 0, 10),
    jobTimeoutMs: number(raw.jobTimeoutMs, DEFAULT_CONFIG.jobTimeoutMs, 3_000, 120_000),
  };
}

/** `config.json` ao lado do .exe (ou na pasta do agente, em desenvolvimento). */
export class ConfigStore {
  readonly file: string;
  private current: AgentConfig;

  constructor(dataDir: string) {
    this.file = join(dataDir, 'config.json');
    let raw: Partial<AgentConfig> = {};
    try {
      raw = JSON.parse(readFileSync(this.file, 'utf8')) as Partial<AgentConfig>;
    } catch {
      // Primeira vez (ou arquivo corrompido): cria com os valores padrão.
    }
    this.current = sanitize(raw);
    this.save();
  }

  get(): AgentConfig {
    return this.current;
  }

  update(patch: Partial<Pick<AgentConfig, 'printerName' | 'codepage'>>): AgentConfig {
    this.current = sanitize({ ...this.current, ...patch });
    this.save();
    return this.current;
  }

  private save() {
    writeFileSync(this.file, `${JSON.stringify(this.current, null, 2)}\n`);
  }
}
