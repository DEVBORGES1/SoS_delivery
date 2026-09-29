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
