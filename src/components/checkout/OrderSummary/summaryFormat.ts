import type { CartItem } from '../../../types/cart';
import type { OrderTotals, OrderType } from '../../../types/order';
import { formatCurrency } from '../../../utils/currency';

export interface OrderSummaryProps {
  items: CartItem[];
  totals: OrderTotals;
  orderType: OrderType;
}

export function feeLabel(orderType: OrderType): string {
  return orderType === 'delivery' ? 'Taxa de entrega' : 'Retirada';
}

export function feeValue(totals: OrderTotals, orderType: OrderType): string {
  if (orderType === 'delivery' && totals.deliveryFeeOriginal === null) return 'Escolha o bairro';
  if (totals.freeDelivery) return 'GRÁTIS';
  return totals.deliveryFee ? formatCurrency(totals.deliveryFee) : 'Grátis';
}

/** Quanto a promoção de entrega grátis economizou (0 sem promoção). */
export function deliverySavings(totals: OrderTotals): number {
  return totals.freeDelivery ? (totals.deliveryFeeOriginal ?? 0) : 0;
}

export function addonsText(item: CartItem): string {
  return item.addons.map((addon) => addon.name).join(', ');
}
