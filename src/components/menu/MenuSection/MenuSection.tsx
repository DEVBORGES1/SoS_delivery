import { useMemo, useState } from 'react';
import { useAddToCart } from '../../../hooks/useCart';
import { useUIStore } from '../../../stores/uiStore';
import type { Category, Product } from '../../../types/product';
import { CategoryFilter } from '../CategoryFilter/CategoryFilter';
import { categoryTabId } from '../CategoryFilter/categoryTabId';
import { ProductGrid } from '../ProductGrid/ProductGrid';

const PANEL_ID = 'menu-products';

interface MenuSectionProps {
  products: Product[];
  categories: Category[];
}

export function MenuSection({ products, categories }: MenuSectionProps) {
  const [activeCategoryId, setActiveCategoryId] = useState(categories[0]?.id ?? '');
  const openProduct = useUIStore((state) => state.openProduct);
  const addToCart = useAddToCart();

  const categoryOptions = useMemo(
    () =>
      categories.map((category) => ({
        ...category,
        productCount: products.filter((product) => product.categoryId === category.id).length,
      })),
    [categories, products],
  );

  const visibleProducts = useMemo(
    () => products.filter((product) => product.categoryId === activeCategoryId),
    [products, activeCategoryId],
  );

  return (
    <section
      id="cardapio"
      aria-labelledby="menu-title"
      className="scroll-mt-[72px] bg-bg-alt py-[clamp(56px,8vw,104px)]"
    >
      <div className="mx-auto max-w-[1280px] px-gutter">
        <div className="flex flex-wrap items-end justify-between gap-x-10 gap-y-4">
          <div>
            <p className="text-[13px] font-extrabold tracking-[.24em] text-accent">CARDÁPIO</p>
            <h2
              id="menu-title"
              className="mt-2 font-display text-[clamp(42px,6.5vw,84px)] leading-[.95] uppercase"
            >
              Escolha seu resgate
            </h2>
          </div>
          <p className="max-w-[340px] text-[15px] text-pretty text-muted">
            Tudo feito na hora. Toque no lanche pra turbinar com adicionais.
          </p>
        </div>

        <CategoryFilter
          categories={categoryOptions}
          activeId={activeCategoryId}
          onChange={setActiveCategoryId}
          panelId={PANEL_ID}
        />

        <div id={PANEL_ID} role="tabpanel" aria-labelledby={categoryTabId(activeCategoryId)}>
          <ProductGrid products={visibleProducts} onOpen={openProduct} onQuickAdd={(product) => addToCart(product)} />
        </div>
      </div>
    </section>
  );
}
