import type { OrderTotals, OrderType } from '../../../types/order';
import { formatCurrency } from '../../../utils/currency';
import { deliverySavings, feeValue } from './summaryFormat';

/** Valor da entrega no resumo: com a promoção, a taxa do bairro riscada e "GRÁTIS". */
export function DeliveryFeeValue({ totals, orderType }: { totals: OrderTotals; orderType: OrderType }) {
  const savings = deliverySavings(totals);
  const value = feeValue(totals, orderType);
  return (
    <>
      {savings > 0 && <s className="mr-1.5">{formatCurrency(savings)}</s>}
      <span className={value === 'GRÁTIS' ? 'font-extrabold text-success-ink' : undefined}>{value}</span>
    </>
  );
}
