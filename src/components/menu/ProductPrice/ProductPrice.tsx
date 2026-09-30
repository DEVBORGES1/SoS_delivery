import type { Product } from '../../../types/product';
import { cn } from '../../../utils/cn';
import { formatCurrency } from '../../../utils/currency';

interface ProductPriceProps {
  product: Pick<Product, 'price' | 'compareAtPrice'>;
  className?: string;
}

/** Preço do produto; em promoção, mostra o preço normal riscado ao lado. */
export function ProductPrice({ product, className }: ProductPriceProps) {
  if (!product.compareAtPrice) return <span className={className}>{formatCurrency(product.price)}</span>;

  return (
    <span className="inline-flex flex-wrap items-baseline gap-x-2">
      <span className="text-[.72em] font-semibold text-muted line-through">
        <span className="sr-only">De </span>
        {formatCurrency(product.compareAtPrice)}
      </span>
      <span className={cn(className, 'text-accent')}>
        <span className="sr-only">por </span>
        {formatCurrency(product.price)}
      </span>
    </span>
  );
}
