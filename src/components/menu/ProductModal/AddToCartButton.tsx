import { cn } from '../../../utils/cn';
import { formatCurrency } from '../../../utils/currency';

interface AddToCartButtonProps {
  available: boolean;
  isAdded: boolean;
  total: number;
  highlightKey: number;
  onClick: () => void;
}

function getButtonState(available: boolean, isAdded: boolean) {
  if (!available) return { label: 'INDISPONÍVEL HOJE', className: 'bg-line text-muted' };
  if (isAdded) return { label: '✓ ADICIONADO!', className: 'bg-whatsapp text-white' };
  return { label: 'ADICIONAR AO CARRINHO — ', className: 'bg-accent text-accent-ink' };
}

export function AddToCartButton({ available, isAdded, total, highlightKey, onClick }: AddToCartButtonProps) {
  const state = getButtonState(available, isAdded);
  const showTotal = available && !isAdded;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!available}
      aria-live="polite"
      className={cn(
        'flex h-[60px] w-full items-center justify-center gap-2 rounded-cta text-[15px] font-extrabold tracking-[.05em] whitespace-pre transition-[background-color,scale] duration-250 active:scale-[.98] disabled:cursor-not-allowed',
        state.className,
      )}
    >
      {state.label}
      {showTotal && (
        <span key={highlightKey} className={cn('inline-block', highlightKey > 0 && 'animate-price-pop')}>
          {formatCurrency(total)}
        </span>
      )}
    </button>
  );
}
