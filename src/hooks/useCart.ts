import { useCallback, useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useCartStore } from '../stores/cartStore';
import { useUIStore } from '../stores/uiStore';
import type { Addon, Product } from '../types/product';
import { calculateItemCount, calculateSubtotal } from '../utils/pricing';

export function useCart() {
  const items = useCartStore((state) => state.items);
  const actions = useCartStore(
    useShallow((state) => ({
      updateQuantity: state.updateQuantity,
      removeItem: state.removeItem,
      clearCart: state.clearCart,
    })),
  );

  const itemCount = useMemo(() => calculateItemCount(items), [items]);
  const subtotal = useMemo(() => calculateSubtotal(items), [items]);

  return { items, itemCount, subtotal, ...actions };
}

/** Adiciona ao carrinho e dispara o feedback visual (toast + pulo do ícone). */
export function useAddToCart() {
  const addItem = useCartStore((state) => state.addItem);
  const notifyItemAdded = useUIStore((state) => state.notifyItemAdded);

  return useCallback(
    (product: Product, quantity = 1, addons: Addon[] = [], note = '') => {
      addItem({ product, quantity, addons, note });
      const prefix = quantity > 1 ? `${quantity}× ` : '';
      notifyItemAdded(`${prefix}${product.name} adicionado`);
    },
    [addItem, notifyItemAdded],
  );
}
