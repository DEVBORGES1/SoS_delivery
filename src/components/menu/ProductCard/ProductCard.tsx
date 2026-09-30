import { Plus } from 'lucide-react';
import type { Product } from '../../../types/product';
import { cn } from '../../../utils/cn';
import { Badge } from '../../ui/Badge/Badge';
import { ProductPrice } from '../ProductPrice/ProductPrice';
import { ProductImage } from './ProductImage';

export interface ProductItemProps {
  product: Product;
  onOpen: (product: Product) => void;
  onQuickAdd: (product: Product) => void;
}

/** Botão que cobre o card inteiro (padrão "stretched link") para abrir o produto. */
export const STRETCHED_BUTTON =
  "text-left [text-transform:inherit] outline-none after:absolute after:inset-0 after:rounded-[inherit] after:content-[''] focus-visible:after:outline-[3px] focus-visible:after:outline-mustard focus-visible:after:outline-solid";

/** Card vertical do cardápio (tablet e desktop). */
export function ProductCard({ product, onOpen, onQuickAdd }: ProductItemProps) {
  const { available } = product;

  return (
    <article
      className={cn(
        'group relative flex flex-col overflow-hidden rounded-card border border-line bg-surface transition-[translate,box-shadow] duration-300 ease-smooth',
        available && 'hover:-translate-y-1.5 hover:shadow-card-hover',
      )}
    >
      <div className="relative aspect-4/3 overflow-hidden bg-placeholder">
        <ProductImage
          product={product}
          className={cn(
            'transition-[scale] duration-600 ease-smooth',
            available ? 'group-hover:scale-[1.07]' : 'grayscale',
          )}
        />
        {product.badge && available && <Badge className="absolute top-3.5 left-3.5">{product.badge}</Badge>}
        {!available && (
          <div className="absolute inset-0 grid place-items-center bg-[rgb(10_8_6/0.55)]">
            <span className="-rotate-6 border-2 border-white px-3.5 py-1.5 font-display text-[22px] text-white">
              ESGOTADO HOJE
            </span>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-5">
        <h3 className="font-display text-[27px] leading-[1.05] tracking-[.01em] uppercase">
          <button type="button" onClick={() => onOpen(product)} className={STRETCHED_BUTTON}>
            {product.name}
          </button>
        </h3>
        <p className="line-clamp-2 text-[14.5px] leading-[1.45] text-muted">{product.description}</p>
        <div className="mt-auto flex items-center justify-between gap-3 pt-3">
          <ProductPrice product={product} className="text-[21px] font-extrabold tracking-[-.01em]" />
          <button
            type="button"
            onClick={() => onQuickAdd(product)}
            disabled={!available}
            aria-label={`Adicionar ${product.name} ao carrinho`}
            className={cn(
              'relative z-10 flex h-[46px] items-center gap-2 rounded-full border-[1.5px] border-line px-[18px] text-sm font-extrabold tracking-[.04em] transition-[background-color,color,border-color,scale] duration-250 active:scale-95',
              available
                ? 'text-ink group-hover:border-accent group-hover:bg-accent group-hover:text-accent-ink'
                : 'cursor-not-allowed text-muted',
            )}
          >
            {available ? (
              <>
                Adicionar <Plus size={16} strokeWidth={2.5} aria-hidden="true" />
              </>
            ) : (
              'Esgotado'
            )}
          </button>
        </div>
      </div>
    </article>
  );
}
