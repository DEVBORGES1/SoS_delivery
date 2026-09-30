import type { Product, Promotion } from '../types/product';

/** Data de hoje no fuso do navegador, no formato AAAA-MM-DD. */
export function todayIso(now: Date = new Date()): string {
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
}

export function isPromotionExpired(promotion: Promotion, today: string = todayIso()): boolean {
  return !!promotion.validUntil && promotion.validUntil < today;
}

/** Ativa e dentro da validade. */
export function isPromotionLive(promotion: Promotion, today: string = todayIso()): boolean {
  return promotion.active && !isPromotionExpired(promotion, today);
}

export function calculatePromoPrice(price: number, promotion: Pick<Promotion, 'discountType' | 'value'>): number {
  const promoPrice =
    promotion.discountType === 'percent' ? (price * (100 - promotion.value)) / 100 : promotion.value;
  return Math.max(0, Math.round(promoPrice * 100) / 100);
}

/** Selo padrão quando a promoção não tem um: "-15%" ou "Promo". */
export function defaultPromoBadge(promotion: Pick<Promotion, 'discountType' | 'value'>): string {
  return promotion.discountType === 'percent' ? `-${promotion.value}%` : 'Promo';
}

/**
 * Aplica as promoções no ar ao cardápio: `price` passa a ser o promocional,
 * `compareAtPrice` guarda o preço normal e o selo da promoção substitui o do item.
 */
export function applyPromotions(products: Product[], promotions: Promotion[], today: string = todayIso()): Product[] {
  const liveByProduct = new Map(
    promotions.filter((promotion) => isPromotionLive(promotion, today)).map((promotion) => [promotion.productId, promotion]),
  );

  return products.map((product) => {
    const promotion = liveByProduct.get(product.id);
    if (!promotion || product.price <= 0) return product;
    const promoPrice = calculatePromoPrice(product.price, promotion);
    if (promoPrice >= product.price) return product;
    return {
      ...product,
      price: promoPrice,
      compareAtPrice: product.price,
      badge: promotion.badge || defaultPromoBadge(promotion),
    };
  });
}
