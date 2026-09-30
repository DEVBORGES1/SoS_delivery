export interface Addon {
  id: string;
  name: string;
  price: number;
}

export interface Category {
  id: string;
  name: string;
  /** Emoji usado na mensagem do pedido enviada ao WhatsApp. */
  emoji: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  /** Chave da foto em `data/productImages.ts`. */
  imageKey?: string;
  /** URL de uma foto enviada pelo painel (tem prioridade sobre `imageKey`). */
  imageUrl?: string;
  /** URL da imagem exibida, resolvida a partir de `imageUrl` ou `imageKey`. Sem imagem, a interface mostra o espaço reservado. */
  image?: string;
  /** `object-position` usado para enquadrar a foto nos cards. */
  imagePosition?: string;
  categoryId: string;
  available: boolean;
  /** Preço normal, riscado no site quando há promoção ativa (`price` já é o promocional). */
  compareAtPrice?: number;
  featured?: boolean;
  /** Texto do selo redondo sobre a foto da capa quando o lanche está em destaque. Vazio = sem selo. */
  coverSticker?: string;
  /** Selo amarelo exibido sobre o produto (ex.: "Mais pedido"). */
  badge?: string;
  /** Posição no cardápio (menor aparece primeiro). */
  sortOrder?: number;
  /** Adicionais que podem ser incluídos no lanche. */
  addons?: Addon[];
}

export type DiscountType = 'percent' | 'price';

export interface Promotion {
  id: string;
  productId: string;
  /** `percent` = desconto em %; `price` = preço final em reais. */
  discountType: DiscountType;
  value: number;
  badge?: string;
  /** Último dia da promoção (AAAA-MM-DD). Sem data, vale até ser pausada. */
  validUntil?: string;
  active: boolean;
}
