import { MEDIA_TABLET_UP, useMediaQuery } from '../../../hooks/useMediaQuery';
import type { Product } from '../../../types/product';
import { ProductCard } from '../ProductCard/ProductCard';
import { ProductListItem } from '../ProductCard/ProductListItem';

interface ProductGridProps {
  products: Product[];
  onOpen: (product: Product) => void;
  onQuickAdd: (product: Product) => void;
}

/** Grade de cards no tablet/desktop; lista compacta no mobile (como no mockup). */
export function ProductGrid({ products, onOpen, onQuickAdd }: ProductGridProps) {
  const isTabletUp = useMediaQuery(MEDIA_TABLET_UP);
  const Item = isTabletUp ? ProductCard : ProductListItem;

  return (
    <ul
      className={
        isTabletUp
          ? 'mt-7 grid grid-cols-[repeat(auto-fill,minmax(min(100%,280px),1fr))] gap-[clamp(16px,2vw,24px)]'
          : 'mt-5 flex flex-col gap-3'
      }
    >
      {products.map((product) => (
        <li key={product.id} className="flex flex-col">
          <Item product={product} onOpen={onOpen} onQuickAdd={onQuickAdd} />
        </li>
      ))}
    </ul>
  );
}
