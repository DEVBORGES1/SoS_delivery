import { formatCurrency } from '../../utils/currency';

/** "32,90" ou "32.90" → 32.9. Retorna `null` se não for um valor válido. */
export function parsePrice(value: string): number | null {
  const normalized = value.trim().replace(/\s|R\$/g, '').replace(/\.(?=\d{3}(\D|$))/g, '').replace(',', '.');
  if (!normalized) return 0;
  const price = Number(normalized);
  return Number.isFinite(price) && price >= 0 ? Math.round(price * 100) / 100 : null;
}

/** 32.9 → "32,90" (valor para editar no campo). */
export function priceToInput(value: number): string {
  return value.toFixed(2).replace('.', ',');
}

/** 0 → "sem preço"; 32.9 → "R$ 32,90". */
export function priceLabel(value: number): string {
  return value > 0 ? formatCurrency(value) : 'sem preço';
}

/** Timestamp → "19:42". */
export function formatClockTime(timestamp: number): string {
  const date = new Date(timestamp);
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

/** Timestamp → "agora", "há 12 min", "há 1h05". */
export function formatAgo(timestamp: number, now: number = Date.now()): string {
  const minutes = Math.round((now - timestamp) / 60_000);
  if (minutes < 1) return 'agora';
  if (minutes < 60) return `há ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours >= 24) return `há ${Math.floor(hours / 24)}d`;
  return `há ${hours}h${rest ? String(rest).padStart(2, '0') : ''}`;
}

/** "2026-10-07" → "07/10". */
export function formatShortDate(iso: string): string {
  return iso ? `${iso.slice(8, 10)}/${iso.slice(5, 7)}` : '';
}

/** Data daqui a `days` dias (AAAA-MM-DD). */
export function isoDatePlusDays(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
