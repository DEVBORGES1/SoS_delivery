import { useCart } from '../../../hooks/useCart';
import { useUIStore } from '../../../stores/uiStore';
import { cn } from '../../../utils/cn';
import { formatCurrency } from '../../../utils/currency';

/** Barra fixa "VER MEU PEDIDO" no rodapé da tela, apenas no mobile. */
export function MobileCartBar() {
  const { itemCount, subtotal } = useCart();
  const isCartOpen = useUIStore((state) => state.isCartOpen);
  const isCartBumping = useUIStore((state) => state.isCartBumping);
  const openCart = useUIStore((state) => state.openCart);

  if (itemCount === 0 || isCartOpen) return null;

  return (
    <button
      type="button"
      onClick={openCart}
      className={cn(
        'fixed right-3 bottom-3 left-3 z-45 flex h-[62px] items-center justify-between rounded-[18px] bg-accent pr-[18px] pl-3 text-[15px] font-extrabold text-accent-ink shadow-bar transition-transform duration-300 ease-spring md:hidden',
        isCartBumping && 'scale-[1.14]',
      )}
    >
      <span className="flex items-center gap-3">
        <span className="grid h-[38px] min-w-[38px] place-items-center rounded-[11px] bg-black/14 text-[15px]">
          {itemCount}
        </span>
        VER MEU PEDIDO
      </span>
      <span>{formatCurrency(subtotal)}</span>
    </button>
  );
}
