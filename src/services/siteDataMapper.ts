import { getProductImage } from '../data/productImages';
import type { Addon, Product } from '../types/product';
import type { DayHours, StoreSettings, StoreStatusOverride, Weekday } from '../types/store';

/** Linha da tabela `products`. */
export interface ProductRow {
  id: string;
  category_id: string;
  name: string;
  description: string;
  price: number | string;
  image_key: string | null;
  image_position: string | null;
  badge: string | null;
  available: boolean;
  featured: boolean;
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
    image: getProductImage(row.image_key),
    imagePosition: row.image_position ?? undefined,
    badge: row.badge || undefined,
    available: row.available,
    featured: row.featured,
    addons: addons.length ? addons : undefined,
  };
}

export function productToRow(product: Product, sortOrder: number): ProductRow {
  return {
    id: product.id,
    category_id: product.categoryId,
    name: product.name.trim(),
    description: product.description.trim(),
    price: product.price,
    image_key: product.imageKey ?? null,
    image_position: product.imagePosition ?? null,
    badge: product.badge?.trim() || null,
    available: product.available,
    featured: product.featured ?? false,
    addons: product.addons ?? [],
    sort_order: sortOrder,
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
  };
}
