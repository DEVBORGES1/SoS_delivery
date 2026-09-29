import type { CartItem } from '../types/cart';
import type { Addon } from '../types/product';
import type { OrderTotals, OrderType } from '../types/order';

export function calculateUnitPrice(basePrice: number, addons: Addon[]): number {
  return addons.reduce((sum, addon) => sum + addon.price, basePrice);
}

export function calculateLineTotal(item: Pick<CartItem, 'unitPrice' | 'quantity'>): number {
  return item.unitPrice * item.quantity;
}

export function calculateItemCount(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.quantity, 0);
}

export function calculateSubtotal(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + calculateLineTotal(item), 0);
}

export function calculateOrderTotals(
  items: CartItem[],
  orderType: OrderType,
  deliveryFee: number,
): OrderTotals {
  const subtotal = calculateSubtotal(items);
  const fee = orderType === 'delivery' ? deliveryFee : 0;
  return { subtotal, deliveryFee: fee, total: subtotal + fee };
}
