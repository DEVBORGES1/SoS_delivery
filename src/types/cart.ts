import type { Addon } from './product';

/**
 * Item do carrinho. Guarda uma cópia dos dados do produto no momento em que
 * foi adicionado, para o carrinho persistido não depender do catálogo.
 */
export interface CartItem {
  /** Identifica a combinação produto + adicionais + observação. */
  key: string;
  productId: string;
  categoryId: string;
  name: string;
  image?: string;
  /** Preço unitário já somado aos adicionais. */
  unitPrice: number;
  quantity: number;
  addons: Addon[];
  note: string;
}
