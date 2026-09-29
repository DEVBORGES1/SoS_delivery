import type { CartItem } from '../types/cart';
import type { Category } from '../types/product';
import type { CheckoutFormData, Order, OrderType, PaymentMethod } from '../types/order';
import { calculateLineTotal, calculateOrderTotals } from './pricing';

export const ORDER_TYPE_LABELS: Record<OrderType, string> = {
  delivery: 'Entrega',
  pickup: 'Retirada',
};

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  pix: 'Pix',
  cash: 'Dinheiro',
  card: 'Cartão',
};

const DEFAULT_EMOJI = '🍽️';

/** Número curto de 4 dígitos para o cliente citar no WhatsApp. */
function generateOrderId(): string {
  return String(Math.floor(1000 + Math.random() * 9000));
}

/** "Rua X, 123 — Centro (Apto 2)" */
export function formatAddress(form: CheckoutFormData): string {
  const complement = form.complement.trim() ? ` (${form.complement.trim()})` : '';
  return `${form.street.trim()}, ${form.number.trim()} — ${form.district.trim()}${complement}`;
}

export function createOrder(
  form: CheckoutFormData,
  items: CartItem[],
  categories: Category[],
  deliveryFee: number,
): Order {
  const emojiByCategory = new Map(categories.map((category) => [category.id, category.emoji]));

  return {
    id: generateOrderId(),
    customer: form,
    items: items.map((item) => ({
      emoji: emojiByCategory.get(item.categoryId) ?? DEFAULT_EMOJI,
      name: item.name,
      quantity: item.quantity,
      addons: item.addons.map((addon) => addon.name),
      note: item.note,
      lineTotal: calculateLineTotal(item),
    })),
    ...calculateOrderTotals(items, form.orderType, deliveryFee),
  };
}
