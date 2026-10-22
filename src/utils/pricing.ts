import type { CartItem } from '../types/cart';
import type { Addon } from '../types/product';
import type { OrderTotals } from '../types/order';
import type { DeliveryQuote } from './delivery';

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

export function calculateOrderTotals(items: CartItem[], delivery: DeliveryQuote): OrderTotals {
  const subtotal = calculateSubtotal(items);
  return {
    subtotal,
    deliveryFee: delivery.fee,
    deliveryFeeOriginal: delivery.originalFee,
    freeDelivery: delivery.freeDelivery,
    total: subtotal + delivery.fee,
  };
}
