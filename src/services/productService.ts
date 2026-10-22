import { categories } from '../data/categories';
import { getProductImage } from '../data/productImages';
import { products as localProducts } from '../data/products';
import { defaultStoreSettings } from '../data/storeConfig';
import { useCartStore } from '../stores/cartStore';
import { useSettingsStore } from '../stores/settingsStore';
import type { Category, Product } from '../types/product';
import { applyPromotions } from '../utils/promotions';
import {
  productFromRow,
  promotionFromRow,
  settingsFromRow,
  zoneFromRow,
  type DeliveryZoneRow,
  type ProductRow,
  type PromotionRow,
  type StoreSettingsRow,
} from './siteDataMapper';
import { isSupabaseConfigured, supabaseConfig } from './supabaseConfig';

export interface Catalog {
  products: Product[];
  /** Só as categorias que têm produtos, na ordem de `data/categories.ts`. */
  categories: Category[];
}

/** Sem resposta do banco nesse tempo, o site segue com os dados do código. */
const REQUEST_TIMEOUT_MS = 5000;
/** Releitura da entrega antes de enviar o pedido: mais curta para não segurar o cliente. */
const DELIVERY_REFRESH_TIMEOUT_MS = 4000;

const ZONES_PATH = 'delivery_zones?select=*&active=eq.true&order=sort_order.asc,name.asc';

let catalogRequest: Promise<Catalog> | null = null;

function buildCatalog(products: Product[]): Catalog {
  const usedCategoryIds = new Set(products.map((product) => product.categoryId));
  return { products, categories: categories.filter((category) => usedCategoryIds.has(category.id)) };
}

function getLocalCatalog(): Catalog {
  return buildCatalog(localProducts.map((product) => ({ ...product, image: getProductImage(product.imageKey) })));
}

/** Leitura pública via REST do Supabase, sem carregar o SDK no site. */
async function fetchTable<T>(path: string, signal: AbortSignal): Promise<T> {
  const response = await fetch(`${supabaseConfig.url}/rest/v1/${path}`, {
    headers: { apikey: supabaseConfig.key, Accept: 'application/json' },
    signal,
  });
  if (!response.ok) throw new Error(`Supabase respondeu ${response.status} em ${path}`);
  return response.json() as Promise<T>;
}

async function loadRemoteCatalog(): Promise<Catalog> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const [productRows, settingsRows, promotionRows, zoneRows] = await Promise.all([
      fetchTable<ProductRow[]>('products?select=*&order=sort_order.asc,name.asc', controller.signal),
      fetchTable<StoreSettingsRow[]>('store_settings?select=*&id=eq.1', controller.signal),
      // Sem a tabela de promoções (banco ainda não atualizado), o cardápio segue sem elas.
      fetchTable<PromotionRow[]>('promotions?select=*&active=eq.true', controller.signal).catch(() => []),
      // Idem para os bairros: sem a tabela, vale a taxa única.
      fetchTable<DeliveryZoneRow[]>(ZONES_PATH, controller.signal).catch(() => []),
    ]);

    if (settingsRows[0]) {
      useSettingsStore.getState().setSettings(settingsFromRow(settingsRows[0], defaultStoreSettings));
    }
    useSettingsStore.getState().setDeliveryZones(zoneRows.map(zoneFromRow));
    return buildCatalog(applyPromotions(productRows.map(productFromRow), promotionRows.map(promotionFromRow)));
  } catch (error) {
    console.warn('Não foi possível carregar os dados do Supabase; usando os dados locais.', error);
    return getLocalCatalog();
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Único ponto de acesso ao catálogo. Com o Supabase configurado, lê produtos e
 * configurações da loja do banco (uma vez por visita); sem ele, ou se o banco
 * não responder, usa os dados locais de `src/data/`.
 */
export function getCatalog(): Promise<Catalog> {
  catalogRequest ??= (isSupabaseConfigured ? loadRemoteCatalog() : Promise.resolve(getLocalCatalog())).then(
    (catalog) => {
      // Um carrinho salvo em outra visita pode ter preços antigos ou itens que saíram do cardápio.
      useCartStore.getState().syncWithCatalog(catalog.products);
      return catalog;
    },
  );
  return catalogRequest;
}

/**
 * Relê do banco o que define a taxa de entrega (bairros, taxa única e a promoção
 * de entrega grátis). O checkout chama ao abrir, ao voltar para a aba e antes de
 * enviar, para o cliente ver a taxa que o banco vai cobrar. Retorna `false` se
 * não conseguiu ler (aí continua valendo o que já estava carregado).
 */
export async function refreshDeliveryConfig(): Promise<boolean> {
  if (!isSupabaseConfigured) return false;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), DELIVERY_REFRESH_TIMEOUT_MS);
  try {
    const [settingsRows, zoneRows] = await Promise.all([
      fetchTable<StoreSettingsRow[]>('store_settings?select=*&id=eq.1', controller.signal),
      // Falha só nos bairros: mantém os que já estavam carregados.
      fetchTable<DeliveryZoneRow[]>(ZONES_PATH, controller.signal).catch(() => null),
    ]);
    const store = useSettingsStore.getState();
    if (settingsRows[0]) store.setSettings(settingsFromRow(settingsRows[0], defaultStoreSettings));
    if (zoneRows) store.setDeliveryZones(zoneRows.map(zoneFromRow));
    return true;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}
