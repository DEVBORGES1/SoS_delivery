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
  /** URL da imagem. Sem imagem, a interface mostra o espaço reservado do mockup. */
  image?: string;
  /** `object-position` usado para enquadrar a foto nos cards. */
  imagePosition?: string;
  categoryId: string;
  available: boolean;
  featured?: boolean;
  /** Selo amarelo exibido sobre o produto (ex.: "Mais pedido"). */
  badge?: string;
  /** Adicionais que podem ser incluídos no lanche. */
  addons?: Addon[];
}
