import { ShoppingBag, X } from 'lucide-react';
import { useCart } from '../../../hooks/useCart';
import { useUIStore } from '../../../stores/uiStore';
import { cn } from '../../../utils/cn';
import { pluralizeItems } from '../../../utils/formatters';
import { SectionLink } from '../../layout/SectionLink';
import { buttonClasses } from '../../ui/Button/buttonStyles';
import { Dialog } from '../../ui/Dialog/Dialog';
import { CartItem } from '../CartItem/CartItem';
import { CartSummary } from '../CartSummary/CartSummary';

function EmptyCart() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-1.5 px-6 py-8 text-center">
      <div className="mb-3.5 grid size-24 place-items-center rounded-full bg-surface-alt text-muted">
        <ShoppingBag size={40} strokeWidth={1.6} aria-hidden="true" />
      </div>
      <h3 className="font-display text-[28px] uppercase">Seu carrinho está vazio</h3>
      <p className="text-base text-muted">Que tal escolher um hambúrguer?</p>
      <SectionLink sectionId="cardapio" className={cn(buttonClasses(), 'mt-5')}>
        VER CARDÁPIO
      </SectionLink>
    </div>
  );
}

export function CartDrawer() {
  const { items, itemCount, subtotal, updateQuantity, removeItem } = useCart();
  const isOpen = useUIStore((state) => state.isCartOpen);
  const closeCart = useUIStore((state) => state.closeCart);

  return (
    <Dialog open={isOpen} onClose={closeCart} variant="drawer" ariaLabelledBy="cart-title" className="flex-col">
      <div aria-hidden="true" className="mx-auto mt-2.5 h-[5px] w-11 rounded-full bg-line md:hidden" />
      <div className="flex items-center justify-between border-b border-line px-5 pt-[18px] pb-3.5">
        <h2 id="cart-title" className="flex items-baseline gap-2.5 font-display text-[28px] uppercase">
          Meu pedido
          {itemCount > 0 && (
            <span className="font-sans text-sm font-bold text-muted normal-case">{pluralizeItems(itemCount)}</span>
          )}
        </h2>
        <button
          type="button"
          onClick={closeCart}
          aria-label="Fechar carrinho"
          className="grid size-11 place-items-center rounded-full bg-surface-alt"
        >
          <X size={20} aria-hidden="true" />
        </button>
      </div>

      {items.length === 0 ? (
        <EmptyCart />
      ) : (
        <>
          <ul className="flex-1 overflow-auto px-5 py-2">
            {items.map((item) => (
              <CartItem key={item.key} item={item} onChangeQuantity={updateQuantity} onRemove={removeItem} />
            ))}
          </ul>
          <CartSummary subtotal={subtotal} />
        </>
      )}
    </Dialog>
  );
}
