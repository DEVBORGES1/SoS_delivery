import { useEffect, useRef, useState } from 'react';
import { useAddToCart } from '../../../hooks/useCart';
import type { Product } from '../../../types/product';
import { calculateUnitPrice } from '../../../utils/pricing';

/** Tempo que o botão fica verde ("✓ ADICIONADO!") antes de fechar o modal. */
const ADDED_FEEDBACK_MS = 550;

/** Estado do modal de produto: quantidade, adicionais, observação e confirmação. */
export function useProductCustomization(product: Product, onDone: () => void) {
  const addToCart = useAddToCart();
  const [quantity, setQuantity] = useState(1);
  const [selectedAddonIds, setSelectedAddonIds] = useState<string[]>([]);
  const [note, setNote] = useState('');
  const [isAdded, setIsAdded] = useState(false);
  /** Muda quando o total sobe, para disparar a animação de destaque do preço. */
  const [highlightKey, setHighlightKey] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(timerRef.current), []);

  const selectedAddons = (product.addons ?? []).filter((addon) => selectedAddonIds.includes(addon.id));
  const total = calculateUnitPrice(product.price, selectedAddons) * quantity;

  const increment = () => {
    setQuantity((value) => value + 1);
    setHighlightKey((key) => key + 1);
  };

  const decrement = () => setQuantity((value) => Math.max(1, value - 1));

  const toggleAddon = (addonId: string) => {
    setSelectedAddonIds((ids) => (ids.includes(addonId) ? ids.filter((id) => id !== addonId) : [...ids, addonId]));
    setHighlightKey((key) => key + 1);
  };

  const confirm = () => {
    if (!product.available || isAdded) return;
    setIsAdded(true);
    timerRef.current = setTimeout(() => {
      addToCart(product, quantity, selectedAddons, note);
      onDone();
    }, ADDED_FEEDBACK_MS);
  };

  return {
    quantity,
    selectedAddonIds,
    note,
    setNote,
    isAdded,
    total,
    highlightKey,
    increment,
    decrement,
    toggleAddon,
    confirm,
  };
}
