import { ShoppingBag } from 'lucide-react';
import { useCart } from '../../../hooks/useCart';
import { useUIStore } from '../../../stores/uiStore';
import { cn } from '../../../utils/cn';
import { pluralizeItems } from '../../../utils/formatters';

export function CartButton() {
  const { itemCount } = useCart();
  const openCart = useUIStore((state) => state.openCart);
  const isCartBumping = useUIStore((state) => state.isCartBumping);

  return (
    <button
      type="button"
      onClick={openCart}
      aria-label={`Abrir carrinho, ${pluralizeItems(itemCount)}`}
      className={cn(
        'relative grid size-[46px] place-items-center rounded-full border border-line bg-surface text-ink transition-transform duration-300 ease-spring',
        isCartBumping && 'scale-[1.14]',
      )}
    >
      <ShoppingBag size={20} strokeWidth={2} aria-hidden="true" />
      {itemCount > 0 && (
        <span
          aria-hidden="true"
          className="absolute -top-1 -right-1 grid h-[21px] min-w-[21px] place-items-center rounded-full border-2 border-bg bg-mustard px-1.5 text-xs font-extrabold text-mustard-ink"
        >
          {itemCount}
        </span>
      )}
    </button>
  );
}
