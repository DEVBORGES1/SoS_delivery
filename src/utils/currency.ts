const brlFormatter = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

/** 31.9 → "R$ 31,90" */
export function formatCurrency(value: number): string {
  return brlFormatter.format(value);
}
