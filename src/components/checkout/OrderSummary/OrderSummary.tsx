import { formatCurrency } from '../../../utils/currency';
import { calculateLineTotal } from '../../../utils/pricing';
import { addonsText, feeLabel, feeValue, type OrderSummaryProps } from './summaryFormat';

/** Resumo lateral fixo do checkout (desktop, a partir de 1024px). */
export function OrderSummary({ items, totals, orderType }: OrderSummaryProps) {
  return (
    <>
      <h2 className="font-display text-[26px] uppercase">Seu pedido</h2>
      <ul className="flex max-h-80 flex-col gap-3.5 overflow-auto">
        {items.map((item) => (
          <li key={item.key} className="flex items-center gap-3">
            <div className="size-[52px] flex-none overflow-hidden rounded-[10px] bg-placeholder">
              {item.image && <img src={item.image} alt="" loading="lazy" className="size-full object-cover" />}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[15px] font-bold">
                {item.quantity}× {item.name}
              </p>
              {item.addons.length > 0 && <p className="text-[13px] text-muted">+ {addonsText(item)}</p>}
            </div>
            <span className="text-[15px] font-bold whitespace-nowrap">{formatCurrency(calculateLineTotal(item))}</span>
          </li>
        ))}
      </ul>
      <dl className="flex flex-col gap-2 border-t border-dashed border-line pt-3.5 text-[15px]">
        <div className="flex justify-between text-muted">
          <dt>Subtotal</dt>
          <dd>{formatCurrency(totals.subtotal)}</dd>
        </div>
        <div className="flex justify-between text-muted">
          <dt>{feeLabel(orderType)}</dt>
          <dd>{feeValue(totals)}</dd>
        </div>
        <div className="mt-1.5 flex items-baseline justify-between">
          <dt className="font-extrabold">Total</dt>
          <dd className="text-[28px] font-extrabold">{formatCurrency(totals.total)}</dd>
        </div>
      </dl>
    </>
  );
}
