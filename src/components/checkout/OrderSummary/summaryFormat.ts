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

export function feeValue(totals: OrderTotals): string {
  return totals.deliveryFee ? formatCurrency(totals.deliveryFee) : 'Grátis';
}

export function addonsText(item: CartItem): string {
  return item.addons.map((addon) => addon.name).join(', ');
}
