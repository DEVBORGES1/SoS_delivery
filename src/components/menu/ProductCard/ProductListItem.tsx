import { Plus } from 'lucide-react';
import { cn } from '../../../utils/cn';
import { formatCurrency } from '../../../utils/currency';
import { Badge } from '../../ui/Badge/Badge';
import { STRETCHED_BUTTON, type ProductItemProps } from './ProductCard';
import { ProductImage } from './ProductImage';

/** Linha horizontal do cardápio (mobile): texto à esquerda, foto à direita. */
export function ProductListItem({ product, onOpen, onQuickAdd }: ProductItemProps) {
  const { available } = product;

  return (
    <article
      className={cn(
        'relative grid grid-cols-[minmax(0,1fr)_118px] gap-3.5 rounded-[18px] border border-line bg-surface p-3.5',
        !available && 'opacity-55',
      )}
    >
      <div className="flex min-w-0 flex-col gap-[5px]">
        {product.badge && available && (
          <Badge size="sm" className="self-start">
            {product.badge}
          </Badge>
        )}
        {!available && (
          <Badge size="sm" tone="accent" className="self-start">
            ESGOTADO HOJE
          </Badge>
        )}
        <h3 className="font-display text-[22px] leading-[1.05] uppercase">
          <button type="button" onClick={() => onOpen(product)} className={STRETCHED_BUTTON}>
            {product.name}
          </button>
        </h3>
        <p className="line-clamp-2 text-[13.5px] leading-[1.4] text-muted">{product.description}</p>
        <span className="mt-auto pt-1 text-[17px] font-extrabold">{formatCurrency(product.price)}</span>
      </div>

      <div className="relative size-[118px] overflow-hidden rounded-control bg-placeholder">
        <ProductImage product={product} placeholderLabel="foto" placeholderClassName="p-2 text-[10px]" />
        <button
          type="button"
          onClick={() => onQuickAdd(product)}
          disabled={!available}
          aria-label={`Adicionar ${product.name} ao carrinho`}
          className={cn(
            'absolute right-1.5 bottom-1.5 z-10 grid size-11 place-items-center rounded-xl text-accent-ink shadow-thumb transition-transform active:scale-90',
            available ? 'bg-accent' : 'bg-line',
          )}
        >
          <Plus size={24} strokeWidth={2.2} aria-hidden="true" />
        </button>
      </div>
    </article>
  );
}
