import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { CartItem } from '../types/cart';
import type { Addon, Product } from '../types/product';
import { calculateUnitPrice } from '../utils/pricing';

interface AddItemInput {
  product: Product;
  quantity: number;
  addons: Addon[];
  note: string;
}

interface CartState {
  items: CartItem[];
  addItem: (input: AddItemInput) => void;
  updateQuantity: (key: string, quantity: number) => void;
  removeItem: (key: string) => void;
  clearCart: () => void;
  /** Atualiza nomes e preços pelo cardápio atual e remove itens que saíram do cardápio ou estão indisponíveis. */
  syncWithCatalog: (products: Product[]) => void;
}

/** Mesma combinação de produto + adicionais + observação vira uma única linha. */
function buildItemKey(productId: string, addons: Addon[], note: string): string {
  const addonIds = addons.map((addon) => addon.id).sort().join(',');
  return `${productId}|${addonIds}|${note}`;
}

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],

      addItem: ({ product, quantity, addons, note }) => {
        const trimmedNote = note.trim();
        const key = buildItemKey(product.id, addons, trimmedNote);

        set((state) => {
          const existing = state.items.find((item) => item.key === key);
          if (existing) {
            return {
              items: state.items.map((item) =>
                item.key === key ? { ...item, quantity: item.quantity + quantity } : item,
              ),
            };
          }

          const newItem: CartItem = {
            key,
            productId: product.id,
            categoryId: product.categoryId,
            name: product.name,
            image: product.image,
            unitPrice: calculateUnitPrice(product.price, addons),
            quantity,
            addons,
            note: trimmedNote,
          };
          return { items: [...state.items, newItem] };
        });
      },

      updateQuantity: (key, quantity) =>
        set((state) => ({
          items:
            quantity > 0
              ? state.items.map((item) => (item.key === key ? { ...item, quantity } : item))
              : state.items.filter((item) => item.key !== key),
        })),

      removeItem: (key) => set((state) => ({ items: state.items.filter((item) => item.key !== key) })),

      clearCart: () => set({ items: [] }),

      syncWithCatalog: (products) =>
        set((state) => {
          const productsById = new Map(products.map((product) => [product.id, product]));
          const synced: CartItem[] = [];

          for (const item of state.items) {
            const product = productsById.get(item.productId);
            if (!product?.available) continue;

            const addonsById = new Map((product.addons ?? []).map((addon) => [addon.id, addon]));
            const addons = item.addons.flatMap((addon) => addonsById.get(addon.id) ?? []);
            const key = buildItemKey(product.id, addons, item.note);
            const existing = synced.find((line) => line.key === key);
            if (existing) {
              existing.quantity += item.quantity;
              continue;
            }

            synced.push({
              ...item,
              key,
              categoryId: product.categoryId,
              name: product.name,
              image: product.image,
              unitPrice: calculateUnitPrice(product.price, addons),
              addons,
            });
          }

          return { items: synced };
        }),
    }),
    {
      name: 'sos-delivery-cart',
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ items: state.items }),
    },
  ),
);
