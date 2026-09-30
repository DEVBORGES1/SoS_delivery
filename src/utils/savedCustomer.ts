import type { CheckoutFormData } from '../types/order';

const STORAGE_KEY = 'sos-delivery-cliente';

/** Campos lembrados para o próximo pedido. Troco e observações mudam a cada pedido. */
const SAVED_FIELDS = [
  'name',
  'phone',
  'orderType',
  'street',
  'number',
  'district',
  'complement',
  'reference',
  'paymentMethod',
] as const satisfies readonly (keyof CheckoutFormData)[];

export type SavedCustomer = Pick<CheckoutFormData, (typeof SAVED_FIELDS)[number]>;

const ORDER_TYPES = ['delivery', 'pickup'];
const PAYMENT_METHODS = ['pix', 'cash', 'card'];

/**
 * Dados do último pedido, guardados só no aparelho do cliente (localStorage).
 * Retorna `null` se não houver nada salvo ou se o conteúdo não for válido.
 */
export function loadSavedCustomer(): SavedCustomer | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data: unknown = JSON.parse(raw);
    if (!data || typeof data !== 'object') return null;
    const record = data as Record<string, unknown>;
    const isValid =
      SAVED_FIELDS.every((field) => typeof record[field] === 'string') &&
      ORDER_TYPES.includes(record.orderType as string) &&
      PAYMENT_METHODS.includes(record.paymentMethod as string) &&
      (record.name as string).trim() !== '';
    if (!isValid) return null;
    return Object.fromEntries(SAVED_FIELDS.map((field) => [field, record[field]])) as SavedCustomer;
  } catch {
    return null;
  }
}

export function saveCustomer(form: CheckoutFormData): void {
  try {
    const data = Object.fromEntries(SAVED_FIELDS.map((field) => [field, form[field]]));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Sem acesso ao armazenamento (aba anônima, bloqueio do navegador): só não lembra.
  }
}

export function clearSavedCustomer(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Idem.
  }
}
