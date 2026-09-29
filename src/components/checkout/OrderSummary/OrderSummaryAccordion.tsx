import { ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { cn } from '../../../utils/cn';
import { formatCurrency } from '../../../utils/currency';
import { pluralizeItems } from '../../../utils/formatters';
import { calculateItemCount, calculateLineTotal } from '../../../utils/pricing';
import { addonsText, feeLabel, feeValue, type OrderSummaryProps } from './summaryFormat';

const PANEL_ID = 'order-summary-items';

/** Resumo recolhível no topo do checkout (mobile e tablet). */
export function OrderSummaryAccordion({ items, totals, orderType }: OrderSummaryProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const itemCount = calculateItemCount(items);

  return (
    <div className="overflow-hidden rounded-[18px] border border-line bg-surface lg:hidden">
      <button
        type="button"
        onClick={() => setIsExpanded((value) => !value)}
        aria-expanded={isExpanded}
        aria-controls={PANEL_ID}
        className="flex min-h-[60px] w-full items-center justify-between gap-3 px-[18px] py-4"
      >
        <span className="text-[15px] font-bold">Resumo · {pluralizeItems(itemCount)}</span>
        <span className="flex items-center gap-2.5 text-[17px] font-extrabold">
          {formatCurrency(totals.total)}
          <ChevronDown
            size={16}
            strokeWidth={2.5}
            aria-hidden="true"
            className={cn('transition-transform duration-250', isExpanded && 'rotate-180')}
          />
        </span>
      </button>
      {isExpanded && (
        <div id={PANEL_ID} className="flex flex-col gap-2.5 border-t border-line px-[18px] pt-3.5 pb-4">
          {items.map((item) => (
            <div key={item.key} className="flex justify-between gap-3 text-sm">
              <span>
                <b>{item.quantity}×</b> {item.name}
                {item.addons.length > 0 && <span className="text-muted"> · + {addonsText(item)}</span>}
              </span>
              <span className="font-bold whitespace-nowrap">{formatCurrency(calculateLineTotal(item))}</span>
            </div>
          ))}
          <div className="flex justify-between text-sm text-muted">
            <span>{feeLabel(orderType)}</span>
            <span>{feeValue(totals)}</span>
          </div>
        </div>
      )}
    </div>
  );
}
