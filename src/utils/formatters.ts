export function onlyDigits(value: string): string {
  return value.replace(/\D/g, '');
}

/** Aplica a máscara (49) 99999-9999 enquanto o usuário digita. */
export function maskPhone(value: string): string {
  const digits = onlyDigits(value).slice(0, 11);
  if (digits.length === 0) return '';
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

/** 1 → "1 item", 3 → "3 itens" */
export function pluralizeItems(count: number): string {
  return `${count} ${count === 1 ? 'item' : 'itens'}`;
}

/** "5549988083394" → "(49) 98808-3394" */
export function formatWhatsappDisplay(number: string): string {
  const digits = onlyDigits(number).replace(/^55(?=\d{10,11}$)/, '');
  if (digits.length === 11) return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  if (digits.length === 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return number;
}
