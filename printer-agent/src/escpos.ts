import { CODEPAGES, decodeByte, encodeText, normalizeForCodepage, type Codepage } from './codepages.ts';

/**
 * Comandos ESC/POS (padrão Epson) usados na comanda. Impressoras sem guilhotina
 * ignoram o comando de corte; por isso a comanda sempre avança o papel antes.
 */
const ESC = 0x1b;
const GS = 0x1d;
const FS = 0x1c;
const LF = 0x0a;

export type Align = 'left' | 'center' | 'right';
/** `normal` = 32 colunas no 58mm; `tall` = altura dupla (32 colunas); `big` = altura e largura duplas (16 colunas). */
export type TextSize = 'normal' | 'tall' | 'big';

export interface PrintLine {
  text: string;
  align: Align;
  bold: boolean;
  size: TextSize;
  /** Texto branco em fundo preto. */
  invert: boolean;
}

export interface LineStyle {
  align?: Align;
  bold?: boolean;
  size?: TextSize;
  invert?: boolean;
}

const SIZE_BYTE: Record<TextSize, number> = { normal: 0x00, tall: 0x01, big: 0x11 };
const ALIGN_BYTE: Record<Align, number> = { left: 0, center: 1, right: 2 };

/**
 * Quebra o texto em linhas de até `width` colunas sem cortar palavras (só corta
 * a palavra que sozinha não cabe na linha). A primeira linha começa com
 * `firstIndent`; as seguintes, com `indent`.
 */
export function wrap(text: string, width: number, indent = '', firstIndent = ''): string[] {
  const lines: string[] = [];
  let current = '';
  const prefix = () => (lines.length > 0 ? indent : firstIndent);
  const room = () => width - prefix().length;
  const flush = () => {
    lines.push(prefix() + current);
    current = '';
  };

  text.split('\n').forEach((paragraph, index) => {
    if (index > 0) flush();
    for (let word of paragraph.split(/\s+/).filter(Boolean)) {
      while (word.length > room()) {
        if (current) flush();
        const size = room();
        current = word.slice(0, size);
        word = word.slice(size);
        flush();
      }
      if (!word) continue;
      if (!current) current = word;
      else if (current.length + 1 + word.length <= room()) current += ` ${word}`;
      else {
        flush();
        current = word;
      }
    }
  });
  flush();
  return lines;
}

/**
 * Documento de impressão: uma lista de linhas já quebradas na largura do papel.
 * O mesmo documento vira bytes ESC/POS (impressora) ou texto (prévia e testes).
 */
export class TicketDocument {
  readonly columns: number;
  readonly codepage: Codepage;
  readonly lines: PrintLine[] = [];

  constructor(columns: number, codepage: Codepage) {
    this.columns = columns;
    this.codepage = codepage;
  }

  /** Colunas disponíveis no tamanho de letra. */
  width(size: TextSize = 'normal'): number {
    return size === 'big' ? Math.floor(this.columns / 2) : this.columns;
  }

  /** Texto quebrado na largura. Espaços no começo viram recuo; `indent` é o recuo das linhas seguintes. */
  text(value: string, style: LineStyle = {}, indent?: string): this {
    const size = style.size ?? 'normal';
    const clean = normalizeForCodepage(value, this.codepage);
    const lead = /^ */.exec(clean)?.[0] ?? '';
    for (const text of wrap(clean.slice(lead.length), this.width(size), indent ?? lead, lead)) this.push(text, style);
    return this;
  }

  private push(text: string, style: LineStyle) {
    this.lines.push({
      text,
      align: style.align ?? 'left',
      bold: style.bold ?? false,
      size: style.size ?? 'normal',
      invert: style.invert ?? false,
    });
  }

  /** Texto à esquerda e valor à direita na mesma linha (ex.: "TOTAL ....... R$ 89,70"). */
  pair(left: string, right: string, style: LineStyle = {}): this {
    const size = style.size ?? 'normal';
    const width = this.width(size);
    const l = normalizeForCodepage(left, this.codepage);
    const r = normalizeForCodepage(right, this.codepage);
    if (l.length + r.length + 1 > width) return this.text(l, style).text(r, { ...style, align: 'right' });
    this.push(l + ' '.repeat(width - l.length - r.length) + r, { ...style, align: 'left' });
    return this;
  }

  rule(char = '-'): this {
    return this.text(char.repeat(this.columns));
  }

  blank(): this {
    this.push('', {});
    return this;
  }

  /** Prévia em texto puro (o que sai no papel, sem os estilos). */
  toText(): string {
    return this.lines
      .map((line) => {
        const width = this.width(line.size);
        const pad = width - line.text.length;
        if (line.align === 'center') return ' '.repeat(Math.max(0, Math.floor(pad / 2))) + line.text;
        if (line.align === 'right') return ' '.repeat(Math.max(0, pad)) + line.text;
        return line.text;
      })
      .join('\n');
  }

  /** Bytes ESC/POS prontos para mandar à impressora. */
  toEscPos(options: { feedLines: number; cut: boolean }): Buffer {
    const chunks: Buffer[] = [];
    const push = (...bytes: number[]) => chunks.push(Buffer.from(bytes));

    push(ESC, 0x40); // ESC @: reinicia a formatação
    push(FS, 0x2e); // FS .: sai do modo de caracteres chineses (padrão de várias 58mm)
    const table = CODEPAGES[this.codepage].escPosTable;
    if (table !== null) push(ESC, 0x74, table); // ESC t n: tabela de caracteres

    for (const line of this.lines) {
      push(ESC, 0x61, ALIGN_BYTE[line.align]);
      push(ESC, 0x45, line.bold ? 1 : 0);
      push(GS, 0x21, SIZE_BYTE[line.size]);
      push(GS, 0x42, line.invert ? 1 : 0);
      chunks.push(encodeText(line.text, this.codepage));
      push(LF);
    }

    // Volta ao normal, avança o papel até passar da serrilha e corta (se houver guilhotina).
    push(GS, 0x21, 0x00, ESC, 0x45, 0, GS, 0x42, 0, ESC, 0x61, 0);
    push(ESC, 0x64, Math.max(0, Math.min(10, options.feedLines)));
    if (options.cut) push(GS, 0x56, 0x42, 0x00);
    return Buffer.concat(chunks);
  }
}

/**
 * Lê bytes ESC/POS de volta como texto: usado pela impressora simulada e pelos
 * testes para conferir o que realmente iria para o papel (inclusive os acentos).
 */
export function escPosToText(data: Buffer, codepage: Codepage): string {
  let out = '';
  for (let i = 0; i < data.length; i++) {
    const byte = data[i];
    if (byte === ESC) {
      const command = data[i + 1];
      if (command === 0x40) i += 1;
      else if (command === 0x64) {
        out += '\n'.repeat(data[i + 2] ?? 0);
        i += 2;
      } else i += 2; // ESC a n, ESC E n, ESC t n
    } else if (byte === GS) {
      const command = data[i + 1];
      if (command === 0x56) i += data[i + 2] === 0x41 || data[i + 2] === 0x42 ? 3 : 2;
      else i += 2; // GS ! n, GS B n
    } else if (byte === FS) {
      i += 1;
    } else if (byte === LF) {
      out += '\n';
    } else {
      out += decodeByte(byte, codepage);
    }
  }
  return out;
}
