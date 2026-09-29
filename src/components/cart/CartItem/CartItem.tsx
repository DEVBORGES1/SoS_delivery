import type { CartItem as CartItemData } from '../../../types/cart';
import { formatCurrency } from '../../../utils/currency';
import { calculateLineTotal } from '../../../utils/pricing';
import { QuantityStepper } from '../../ui/QuantityStepper/QuantityStepper';

interface CartItemProps {
  item: CartItemData;
  onChangeQuantity: (key: string, quantity: number) => void;
  onRemove: (key: string) => void;
}

export function CartItem({ item, onChangeQuantity, onRemove }: CartItemProps) {
  const isLastUnit = item.quantity === 1;

  return (
    <li className="flex gap-3.5 border-b border-line py-4">
      <div className="bg-stripes size-[72px] flex-none overflow-hidden rounded-control">
        {item.image && (
          <img src={item.image} alt="" loading="lazy" decoding="async" className="size-full object-cover" />
        )}
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex justify-between gap-2.5 text-base font-extrabold">
          <span>{item.name}</span>
          <span className="whitespace-nowrap">{formatCurrency(calculateLineTotal(item))}</span>
        </div>
        {item.addons.length > 0 && (
          <span className="text-[13px] text-muted">+ {item.addons.map((addon) => addon.name).join(', ')}</span>
        )}
        {item.note && <span className="text-[13px] text-muted italic">“{item.note}”</span>}
        <div className="mt-1.5 self-start">
          <QuantityStepper
            size="sm"
            value={item.quantity}
            decrementRemoves={isLastUnit}
            decrementLabel={isLastUnit ? `Remover ${item.name}` : `Diminuir ${item.name}`}
            incrementLabel={`Aumentar ${item.name}`}
            onDecrement={() => (isLastUnit ? onRemove(item.key) : onChangeQuantity(item.key, item.quantity - 1))}
            onIncrement={() => onChangeQuantity(item.key, item.quantity + 1)}
          />
        </div>
      </div>
    </li>
  );
}
