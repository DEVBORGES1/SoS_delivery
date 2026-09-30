import { getProductImage } from '../data/productImages';
import type { AdminOrder, OrderHistoryEntry, OrderStatus, PaymentMethod, SavedOrderLine } from '../types/order';
import type { Addon, DiscountType, Product, Promotion } from '../types/product';
import type { DayHours, StoreSettings, StoreStatusOverride, Weekday } from '../types/store';

/** Linha da tabela `products`. */
export interface ProductRow {
  id: string;
  category_id: string;
  name: string;
  description: string;
  price: number | string;
  image_key: string | null;
  image_url: string | null;
  image_position: string | null;
  badge: string | null;
  available: boolean;
  featured: boolean;
  /** Ausente enquanto o schema.sql atualizado não foi rodado. */
  cover_sticker?: string | null;
  addons: Addon[] | null;
  sort_order: number;
}

/** Linha única da tabela `store_settings`. */
export interface StoreSettingsRow {
  status_override: StoreStatusOverride;
  weekly_hours: DayHours[];
  delivery_enabled: boolean;
  pickup_enabled: boolean;
  delivery_fee: number | string;
  delivery_eta: string;
  pickup_eta: string;
  whatsapp?: string | null;
  banner_enabled?: boolean | null;
  banner_text?: string | null;
}

/** Linha da tabela `promotions`. */
export interface PromotionRow {
  id: string;
  product_id: string;
  discount_type: DiscountType;
  value: number | string;
  badge: string | null;
  valid_until: string | null;
  active: boolean;
}

/** Linha da tabela `orders` (só administradores leem). */
export interface OrderRow {
  id: number;
  created_at: string;
  status: OrderStatus;
  customer_name: string;
  customer_phone: string;
  order_type: 'delivery' | 'pickup';
  address: string;
  reference: string;
  payment_method: PaymentMethod;
  change_for: string;
  notes: string;
  items: SavedOrderLine[] | null;
  subtotal: number | string;
  delivery_fee: number | string;
  total: number | string;
  history: OrderHistoryEntry[] | null;
}

const WEEKDAYS = new Set<number>([0, 1, 2, 3, 4, 5, 6]);
const STATUS_OVERRIDES = new Set<string>(['auto', 'open', 'closed']);

function toHour(value: unknown): number | null {
  return typeof value === 'number' && value >= 0 && value <= 24 ? value : null;
}

function sanitizeWeeklyHours(value: unknown): DayHours[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((entry) => entry && WEEKDAYS.has(entry.day))
    .map((entry) => ({ day: entry.day as Weekday, opensAt: toHour(entry.opensAt), closesAt: toHour(entry.closesAt) }));
}

function sanitizeAddons(value: unknown): Addon[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((addon) => addon && typeof addon.id === 'string' && typeof addon.name === 'string')
    .map((addon) => ({ id: addon.id, name: addon.name, price: Number(addon.price) || 0 }));
}

export function productFromRow(row: ProductRow): Product {
  const addons = sanitizeAddons(row.addons);
  return {
    id: row.id,
    categoryId: row.category_id,
    name: row.name,
    description: row.description ?? '',
    price: Number(row.price) || 0,
    imageKey: row.image_key ?? undefined,
    imageUrl: row.image_url ?? undefined,
    image: row.image_url || getProductImage(row.image_key),
    imagePosition: row.image_position ?? undefined,
    badge: row.badge || undefined,
    available: row.available,
    featured: row.featured,
    coverSticker: row.cover_sticker ?? undefined,
    addons: addons.length ? addons : undefined,
    sortOrder: row.sort_order,
  };
}

export function productToRow(product: Product, sortOrder: number): ProductRow {
  return {
    id: product.id,
    category_id: product.categoryId,
    name: product.name.trim(),
    description: product.description.trim(),
    price: product.price,
    image_key: product.imageUrl ? null : (product.imageKey ?? null),
    image_url: product.imageUrl ?? null,
    image_position: product.imagePosition ?? null,
    badge: product.badge?.trim() || null,
    available: product.available,
    featured: product.featured ?? false,
    cover_sticker: product.coverSticker?.trim() ?? '',
    addons: product.addons ?? [],
    sort_order: sortOrder,
  };
}

export function promotionFromRow(row: PromotionRow): Promotion {
  return {
    id: row.id,
    productId: row.product_id,
    discountType: row.discount_type,
    value: Number(row.value) || 0,
    badge: row.badge || undefined,
    validUntil: row.valid_until || undefined,
    active: row.active,
  };
}

export function promotionToRow(promotion: Promotion): PromotionRow {
  return {
    id: promotion.id,
    product_id: promotion.productId,
    discount_type: promotion.discountType,
    value: promotion.value,
    badge: promotion.badge?.trim() || null,
    valid_until: promotion.validUntil || null,
    active: promotion.active,
  };
}

export function settingsFromRow(row: StoreSettingsRow, fallback: StoreSettings): StoreSettings {
  const weeklyHours = sanitizeWeeklyHours(row.weekly_hours);
  return {
    statusOverride: STATUS_OVERRIDES.has(row.status_override) ? row.status_override : fallback.statusOverride,
    weeklyHours: weeklyHours.length ? weeklyHours : fallback.weeklyHours,
    deliveryEnabled: row.delivery_enabled ?? fallback.deliveryEnabled,
    pickupEnabled: row.pickup_enabled ?? fallback.pickupEnabled,
    deliveryFee: Number(row.delivery_fee) || 0,
    deliveryEta: row.delivery_eta || fallback.deliveryEta,
    pickupEta: row.pickup_eta || fallback.pickupEta,
    whatsapp: row.whatsapp || fallback.whatsapp,
    bannerEnabled: row.banner_enabled ?? fallback.bannerEnabled,
    bannerText: row.banner_text ?? fallback.bannerText,
  };
}

export function settingsToRow(settings: StoreSettings): StoreSettingsRow {
  return {
    status_override: settings.statusOverride,
    weekly_hours: settings.weeklyHours,
    delivery_enabled: settings.deliveryEnabled,
    pickup_enabled: settings.pickupEnabled,
    delivery_fee: settings.deliveryFee,
    delivery_eta: settings.deliveryEta.trim(),
    pickup_eta: settings.pickupEta.trim(),
    whatsapp: settings.whatsapp,
    banner_enabled: settings.bannerEnabled,
    banner_text: settings.bannerText.trim(),
  };
}

export function orderFromRow(row: OrderRow): AdminOrder {
  return {
    id: row.id,
    createdAt: new Date(row.created_at).getTime(),
    status: row.status,
    customerName: row.customer_name,
    customerPhone: row.customer_phone,
    orderType: row.order_type,
    address: row.address,
    reference: row.reference,
    paymentMethod: row.payment_method,
    changeFor: row.change_for,
    notes: row.notes,
    items: Array.isArray(row.items) ? row.items : [],
    subtotal: Number(row.subtotal) || 0,
    deliveryFee: Number(row.delivery_fee) || 0,
    total: Number(row.total) || 0,
    history: Array.isArray(row.history) ? row.history : [],
  };
}
