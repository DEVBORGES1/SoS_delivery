import { Check } from 'lucide-react';
import { useUIStore } from '../../../stores/uiStore';
import { cn } from '../../../utils/cn';

/** Confirmação "X adicionado" com atalho para abrir o carrinho. */
export function CartToast() {
  const message = useUIStore((state) => state.toastMessage);
  const isVisible = useUIStore((state) => state.isToastVisible);
  const openCart = useUIStore((state) => state.openCart);

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        'fixed bottom-40 left-1/2 z-70 flex w-max max-w-[calc(100vw-24px)] -translate-x-1/2 items-center gap-3.5 rounded-control bg-ink py-2.5 pr-2.5 pl-4 text-bg shadow-toast transition-[translate,opacity] duration-300 ease-smooth md:bottom-7',
        isVisible ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-5 opacity-0',
      )}
    >
      <span className="grid size-[26px] flex-none place-items-center rounded-full bg-whatsapp text-white">
        <Check size={14} strokeWidth={3.5} aria-hidden="true" />
      </span>
      <span className="text-sm font-bold">{message}</span>
      <button
        type="button"
        onClick={openCart}
        tabIndex={isVisible ? 0 : -1}
        className="h-9 rounded-[10px] bg-accent px-3.5 text-[13px] font-extrabold text-accent-ink"
      >
        Ver pedido
      </button>
    </div>
  );
}
