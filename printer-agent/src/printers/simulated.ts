import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { Codepage } from '../codepages.ts';
import { escPosToText } from '../escpos.ts';
import { PrintError, type PrintErrorCode, type PrinterDriver, type PrinterInfo } from './types.ts';

/**
 * Impressora de mentira para testar sem o aparelho (`--simular`). Cada comanda vira
 * um .bin (bytes ESC/POS) e um .txt (o que sairia no papel) em `saida-simulada/`.
 * Edite `simulador.json` com o agente rodando para simular os problemas:
 *   "estado": "online" | "desligada" | "sem-papel" | "travada" | "removida"
 */
export type SimulatedState = 'online' | 'desligada' | 'sem-papel' | 'travada' | 'removida';

interface SimulatorFile {
  impressora: string;
  estado: SimulatedState;
  /** Tempo que a impressão "leva", em ms. */
  demoraMs: number;
}

const DEFAULTS: SimulatorFile = { impressora: 'POS-58 (simulada)', estado: 'online', demoraMs: 600 };

const PROBLEM: Record<SimulatedState, PrintErrorCode | null> = {
  online: null,
  desligada: 'PRINTER_OFFLINE',
  'sem-papel': 'PAPER_OUT',
  travada: null,
  removida: null,
};

export class SimulatedPrinterDriver implements PrinterDriver {
  readonly simulated = true;
  readonly outputDir: string;
  private readonly file: string;
  private readonly codepage: () => Codepage;
  /** Quantas comandas "saíram", para os testes conferirem duplicidade. */
  printed: { documentName: string; text: string }[] = [];

  constructor(dataDir: string, codepage: () => Codepage) {
    this.file = join(dataDir, 'simulador.json');
    this.outputDir = join(dataDir, 'saida-simulada');
    this.codepage = codepage;
  }

  async read(): Promise<SimulatorFile> {
    try {
      return { ...DEFAULTS, ...(JSON.parse(await readFile(this.file, 'utf8')) as Partial<SimulatorFile>) };
    } catch {
      await this.write(DEFAULTS);
      return DEFAULTS;
    }
  }

  async write(state: Partial<SimulatorFile>): Promise<void> {
    const current = await readFile(this.file, 'utf8')
      .then((text) => JSON.parse(text) as SimulatorFile)
      .catch(() => DEFAULTS);
    await writeFile(this.file, `${JSON.stringify({ ...current, ...state }, null, 2)}\n`);
  }

  async list(): Promise<PrinterInfo[]> {
    const sim = await this.read();
    if (sim.estado === 'removida') return [];
    const problem = PROBLEM[sim.estado];
    return [
      {
        name: sim.impressora,
        driver: 'Simulador ESC/POS',
        port: 'USB001',
        isDefault: false,
        status: problem ? sim.estado : 'Normal',
        ready: problem === null,
        problem,
      },
    ];
  }

  async print(printerName: string, data: Buffer, documentName: string, timeoutMs: number): Promise<void> {
    const sim = await this.read();
    if (sim.estado === 'removida' || printerName !== sim.impressora) throw new PrintError('PRINTER_NOT_FOUND');
    await new Promise((resolve) => setTimeout(resolve, Math.min(sim.demoraMs, timeoutMs)));
    if (sim.estado === 'travada') {
      await new Promise((resolve) => setTimeout(resolve, Math.max(0, timeoutMs - sim.demoraMs)));
      throw new PrintError('PRINT_TIMEOUT');
    }
    const problem = PROBLEM[sim.estado];
    if (problem) throw new PrintError(problem);

    const text = escPosToText(data, this.codepage());
    const safeName = documentName.replace(/[^\w.-]+/g, '_');
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    await mkdir(this.outputDir, { recursive: true });
    await writeFile(join(this.outputDir, `${stamp}_${safeName}.bin`), data);
    await writeFile(join(this.outputDir, `${stamp}_${safeName}.txt`), `${text}\n`, 'utf8');
    this.printed.push({ documentName, text });
  }
}
