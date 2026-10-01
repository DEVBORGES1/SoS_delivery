import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const MAX_ENTRIES = 2000;

/**
 * Pedidos que já saíram nesta impressora (`impressas.json`). É a segunda trava
 * contra comanda duplicada: mesmo que o painel peça de novo (aba recarregada,
 * resposta perdida no meio do caminho), o agente não imprime outra vez sem `reprint`.
 */
export class PrintJournal {
  private readonly file: string;
  private readonly entries: Map<string, number>;

  constructor(dataDir: string) {
    this.file = join(dataDir, 'impressas.json');
    let saved: Record<string, number> = {};
    try {
      saved = JSON.parse(readFileSync(this.file, 'utf8')) as Record<string, number>;
    } catch {
      // Ainda não imprimiu nada.
    }
    this.entries = new Map(Object.entries(saved).filter(([, at]) => typeof at === 'number'));
  }

  /** O número do pedido mais a data em que chegou: continua único mesmo se o banco for recriado. */
  static key(orderId: number, createdAt: number): string {
    return `${orderId}@${createdAt}`;
  }

  printedAt(key: string): number | undefined {
    return this.entries.get(key);
  }

  add(key: string, at = Date.now()) {
    this.entries.delete(key);
    this.entries.set(key, at);
    while (this.entries.size > MAX_ENTRIES) this.entries.delete(this.entries.keys().next().value as string);
    writeFileSync(this.file, `${JSON.stringify(Object.fromEntries(this.entries))}\n`);
  }
}
