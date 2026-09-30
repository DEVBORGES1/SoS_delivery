import { useMemo, useState } from 'react';
import { useAddToCart } from '../../../hooks/useCart';
import { useUIStore } from '../../../stores/uiStore';
import type { Category, Product } from '../../../types/product';
import { CategoryFilter } from '../CategoryFilter/CategoryFilter';
import { categoryTabId } from '../CategoryFilter/categoryTabId';
import { ProductGrid } from '../ProductGrid/ProductGrid';

const PANEL_ID = 'menu-products';
/** Aba que mostra o cardápio inteiro, separado por categoria. */
const ALL_ID = 'todos';

interface MenuSectionProps {
  products: Product[];
  categories: Category[];
}

export function MenuSection({ products, categories }: MenuSectionProps) {
  const [activeCategoryId, setActiveCategoryId] = useState(ALL_ID);
  const openProduct = useUIStore((state) => state.openProduct);
  const addToCart = useAddToCart();

  const groups = useMemo(
    () =>
      categories.map((category) => ({
        category,
        products: products.filter((product) => product.categoryId === category.id),
      })),
    [categories, products],
  );

  const categoryOptions = useMemo(
    () => [
      { id: ALL_ID, name: 'Todos', emoji: '', productCount: products.length },
      ...groups.map(({ category, products: items }) => ({ ...category, productCount: items.length })),
    ],
    [groups, products.length],
  );

  const onQuickAdd = (product: Product) => addToCart(product);

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
            Tudo feito na hora. Toque no item pra ver os detalhes e deixar uma observação.
          </p>
        </div>

        <CategoryFilter
          categories={categoryOptions}
          activeId={activeCategoryId}
          onChange={setActiveCategoryId}
          panelId={PANEL_ID}
        />

        <div id={PANEL_ID} role="tabpanel" aria-labelledby={categoryTabId(activeCategoryId)}>
          {activeCategoryId === ALL_ID ? (
            groups
              .filter((group) => group.products.length > 0)
              .map(({ category, products: items }) => (
                <section key={category.id} aria-labelledby={`menu-group-${category.id}`} className="mt-10 first:mt-7">
                  <h3
                    id={`menu-group-${category.id}`}
                    className="flex items-baseline gap-2.5 font-display text-[clamp(26px,3.2vw,36px)] leading-none uppercase"
                  >
                    {category.name}
                    <span className="font-sans text-sm font-extrabold text-muted">{items.length}</span>
                  </h3>
                  <ProductGrid products={items} onOpen={openProduct} onQuickAdd={onQuickAdd} />
                </section>
              ))
          ) : (
            <ProductGrid
              products={groups.find((group) => group.category.id === activeCategoryId)?.products ?? []}
              onOpen={openProduct}
              onQuickAdd={onQuickAdd}
            />
          )}
        </div>
      </div>
    </section>
  );
}
