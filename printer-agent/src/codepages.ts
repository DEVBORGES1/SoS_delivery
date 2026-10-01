/**
 * Tabelas de caracteres da impressora. A térmica não entende UTF-8: cada letra
 * acentuada vira um byte da tabela escolhida com o comando ESC t n.
 * Os bytes abaixo foram gerados com System.Text.Encoding do Windows (páginas 850 e 860).
 */
export type Codepage = 'cp850' | 'cp860' | 'wpc1252' | 'ascii';

export const CODEPAGE_IDS: Codepage[] = ['cp850', 'cp860', 'wpc1252', 'ascii'];

interface CodepageInfo {
  label: string;
  /** Número da tabela no comando ESC t n (padrão Epson). `null` = não troca a tabela. */
  escPosTable: number | null;
  map: Record<string, number>;
}

const CP850: Record<string, number> = {
  Á: 0xb5, À: 0xb7, Â: 0xb6, Ã: 0xc7, Ä: 0x8e, É: 0x90, È: 0xd4, Ê: 0xd2, Ë: 0xd3, Í: 0xd6, Ì: 0xde, Î: 0xd7,
  Ï: 0xd8, Ó: 0xe0, Ò: 0xe3, Ô: 0xe2, Õ: 0xe5, Ö: 0x99, Ú: 0xe9, Ù: 0xeb, Û: 0xea, Ü: 0x9a, Ç: 0x80, Ñ: 0xa5,
  á: 0xa0, à: 0x85, â: 0x83, ã: 0xc6, ä: 0x84, é: 0x82, è: 0x8a, ê: 0x88, ë: 0x89, í: 0xa1, ì: 0x8d, î: 0x8c,
  ï: 0x8b, ó: 0xa2, ò: 0x95, ô: 0x93, õ: 0xe4, ö: 0x94, ú: 0xa3, ù: 0x97, û: 0x96, ü: 0x81, ç: 0x87, ñ: 0xa4,
  º: 0xa7, ª: 0xa6, '°': 0xf8,
};

const CP860: Record<string, number> = {
  Á: 0x86, À: 0x91, Â: 0x8f, Ã: 0x8e, É: 0x90, È: 0x92, Ê: 0x89, Í: 0x8b, Ì: 0x98, Ó: 0x9f, Ò: 0xa9, Ô: 0x8c,
  Õ: 0x99, Ú: 0x96, Ù: 0x9d, Ü: 0x9a, Ç: 0x80, Ñ: 0xa5, á: 0xa0, à: 0x85, â: 0x83, ã: 0x84, é: 0x82, è: 0x8a,
  ê: 0x88, í: 0xa1, ì: 0x8d, ó: 0xa2, ò: 0x95, ô: 0x93, õ: 0x94, ú: 0xa3, ù: 0x97, ü: 0x81, ç: 0x87, ñ: 0xa4,
  º: 0xa7, ª: 0xa6, '°': 0xf8,
};

/** Windows-1252: as letras latinas têm o mesmo número do Unicode. */
const WPC1252: Record<string, number> = Object.fromEntries(
  [...'ÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇÑáàâãäéèêëíìîïóòôõöúùûüçñºª°'].map((char) => [char, char.charCodeAt(0)]),
);

export const CODEPAGES: Record<Codepage, CodepageInfo> = {
  cp850: { label: 'PC850 (Multilingual)', escPosTable: 2, map: CP850 },
  cp860: { label: 'PC860 (Português)', escPosTable: 3, map: CP860 },
  wpc1252: { label: 'Windows-1252', escPosTable: 16, map: WPC1252 },
  ascii: { label: 'Sem acentos', escPosTable: null, map: {} },
};

export function isCodepage(value: unknown): value is Codepage {
  return typeof value === 'string' && (CODEPAGE_IDS as string[]).includes(value);
}

/** Troca símbolos comuns em textos do site por equivalentes que qualquer tabela tem. */
const REPLACEMENTS: Record<string, string> = {
  '—': '-',
  '–': '-',
  '‐': '-',
  '“': '"',
  '”': '"',
  '‘': "'",
  '’': "'",
  '…': '...',
  '•': '*',
  '×': 'x',
  '½': '1/2',
  '€': 'EUR',
  ' ': ' ',
};

/** Emojis e caracteres invisíveis que acompanham emojis: somem da comanda. */
function isDropped(char: string): boolean {
  const code = char.codePointAt(0) ?? 0;
  return (
    code > 0xffff ||
    (code >= 0x2600 && code <= 0x27bf) ||
    (code >= 0xfe00 && code <= 0xfe0f) ||
    code === 0x200d ||
    code === 0x20e3
  );
}

/**
 * Deixa o texto só com caracteres que a tabela consegue imprimir.
 * O que não existe na tabela perde o acento (ã → a); o resto vira "?".
 */
export function normalizeForCodepage(text: string, codepage: Codepage): string {
  const { map } = CODEPAGES[codepage];
  let result = '';
  for (const char of text) {
    const code = char.codePointAt(0) ?? 0;
    if (code === 0x0a) {
      result += '\n';
      continue;
    }
    if (code < 0x20 || code === 0x7f || isDropped(char)) continue;
    if (code < 0x80 || map[char] !== undefined) {
      result += char;
      continue;
    }
    const replacement = REPLACEMENTS[char];
    if (replacement !== undefined) {
      result += replacement;
      continue;
    }
    const plain = char.normalize('NFD').replace(/[̀-ͯ]/g, '');
    result += /^[\x20-\x7e]+$/.test(plain) ? plain : '?';
  }
  return result;
}

/** Texto (já normalizado ou não) → bytes da tabela. */
export function encodeText(text: string, codepage: Codepage): Buffer {
  const { map } = CODEPAGES[codepage];
  const bytes: number[] = [];
  for (const char of normalizeForCodepage(text, codepage)) {
    const code = char.charCodeAt(0);
    bytes.push(code < 0x80 ? code : (map[char] ?? 0x3f));
  }
  return Buffer.from(bytes);
}

/** Byte da tabela → caractere (usado na prévia do simulador e nos testes). */
export function decodeByte(byte: number, codepage: Codepage): string {
  if (byte < 0x80) return String.fromCharCode(byte);
  const { map } = CODEPAGES[codepage];
  for (const [char, value] of Object.entries(map)) if (value === byte) return char;
  return '?';
}
