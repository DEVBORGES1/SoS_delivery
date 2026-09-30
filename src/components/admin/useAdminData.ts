import { useCallback, useEffect, useRef, useState } from 'react';
import { defaultStoreSettings } from '../../data/storeConfig';
import { describeError, supabase } from '../../services/supabaseClient';
import {
  orderFromRow,
  productFromRow,
  productToRow,
  promotionFromRow,
  promotionToRow,
  settingsFromRow,
  settingsToRow,
  type OrderRow,
  type ProductRow,
  type PromotionRow,
  type StoreSettingsRow,
} from '../../services/siteDataMapper';
import { useSettingsStore } from '../../stores/settingsStore';
import type { AdminOrder, OrderStatus } from '../../types/order';
import type { Product, Promotion } from '../../types/product';
import type { StoreSettings } from '../../types/store';

export interface Toast {
  id: number;
  text: string;
  tone: 'success' | 'error';
}

/** Pedidos dos últimos dias carregados no painel. */
const ORDERS_WINDOW_DAYS = 14;
/** Reserva caso o Realtime caia: recarrega os pedidos a cada 30 s. */
const ORDERS_POLL_MS = 30_000;

function sortOrders(orders: AdminOrder[]): AdminOrder[] {
  return [...orders].sort((a, b) => b.createdAt - a.createdAt);
}

/** Bipe curto para pedido novo (só toca depois de alguma interação com a página). */
function playNewOrderBeep() {
  try {
    const context = new AudioContext();
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.frequency.value = 880;
    gain.gain.setValueAtTime(0.2, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.6);
    oscillator.connect(gain).connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + 0.6);
  } catch {
    // Sem áudio disponível: o contador na aba já avisa.
  }
}

/**
 * Estado do painel: cardápio, promoções, configurações e pedidos, com as
 * funções que gravam no Supabase e o aviso ("toast") de cada ação.
 */
export function useAdminData() {
  const [products, setProducts] = useState<Product[]>([]);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [settings, setSettingsState] = useState<StoreSettings>(defaultStoreSettings);
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [toast, setToast] = useState<Toast | null>(null);
  const knownOrderIds = useRef<Set<number> | null>(null);

  const notify = useCallback((text: string, tone: Toast['tone'] = 'success') => {
    setToast({ id: Date.now(), text, tone });
  }, []);

  const applySettings = useCallback((next: StoreSettings) => {
    setSettingsState(next);
    // Mantém o status (aberta/fechada) do painel igual ao do site.
    useSettingsStore.getState().setSettings(next);
  }, []);

  const receiveOrders = useCallback((next: AdminOrder[]) => {
    const known = knownOrderIds.current;
    if (known && next.some((order) => order.status === 'novo' && !known.has(order.id))) playNewOrderBeep();
    knownOrderIds.current = new Set(next.map((order) => order.id));
    setOrders(sortOrders(next));
  }, []);

  const fetchOrders = useCallback(async () => {
    if (!supabase) return;
    const since = new Date(Date.now() - ORDERS_WINDOW_DAYS * 86_400_000).toISOString();
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .gte('created_at', since)
      .order('created_at', { ascending: false })
      .limit(300);
    if (!error && data) receiveOrders((data as OrderRow[]).map(orderFromRow));
  }, [receiveOrders]);

  // Carga inicial.
  useEffect(() => {
    if (!supabase) return;
    let active = true;
    Promise.all([
      supabase.from('products').select('*').order('sort_order').order('name'),
      supabase.from('promotions').select('*').order('created_at', { ascending: false }),
      supabase.from('store_settings').select('*').eq('id', 1).maybeSingle<StoreSettingsRow>(),
    ]).then(([productsResult, promotionsResult, settingsResult]) => {
      if (!active) return;
      const error = productsResult.error ?? settingsResult.error ?? promotionsResult.error;
      if (error) setToast({ id: Date.now(), text: describeError(error), tone: 'error' });
      setProducts(((productsResult.data ?? []) as ProductRow[]).map(productFromRow));
      setPromotions(((promotionsResult.data ?? []) as PromotionRow[]).map(promotionFromRow));
      if (settingsResult.data) applySettings(settingsFromRow(settingsResult.data, defaultStoreSettings));
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [applySettings]);

  // Pedidos em tempo real, com recarga periódica e ao voltar para a aba.
  useEffect(() => {
    const client = supabase;
    if (!client) return;
    const channel = client
      .channel('admin-orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => void fetchOrders())
      .subscribe();
    const firstLoad = setTimeout(() => void fetchOrders(), 0);
    const timer = setInterval(() => void fetchOrders(), ORDERS_POLL_MS);
    const onFocus = () => void fetchOrders();
    window.addEventListener('focus', onFocus);
    return () => {
      void client.removeChannel(channel);
      clearTimeout(firstLoad);
      clearInterval(timer);
      window.removeEventListener('focus', onFocus);
    };
  }, [fetchOrders]);

  /** Executa uma gravação e mostra o resultado. Retorna `true` se deu certo. */
  const run = useCallback(
    async (action: () => PromiseLike<{ error: unknown }>, successText: string): Promise<boolean> => {
      setSaving(true);
      const { error } = await action();
      setSaving(false);
      if (error) {
        notify(describeError(error), 'error');
        return false;
      }
      setSavedAt(new Date());
      notify(successText);
      return true;
    },
    [notify],
  );

  const saveSettings = useCallback(
    async (patch: Partial<StoreSettings>, successText: string) => {
      if (!supabase) return false;
      const next = { ...settings, ...patch };
      const client = supabase;
      const ok = await run(
        () => client.from('store_settings').upsert({ id: 1, ...settingsToRow(next), updated_at: new Date().toISOString() }),
        successText,
      );
      if (ok) applySettings(next);
      return ok;
    },
    [settings, run, applySettings],
  );

  const saveProduct = useCallback(
    async (product: Product, successText: string) => {
      if (!supabase) return false;
      const client = supabase;
      const existing = products.find((item) => item.id === product.id);
      // Item novo entra no topo do cardápio, como no mockup.
      const sortOrder =
        existing?.sortOrder ?? Math.min(0, ...products.map((item) => item.sortOrder ?? 0)) - 1;
      const next = { ...product, sortOrder };
      const ok = await run(() => client.from('products').upsert(productToRow(next, sortOrder)), successText);
      if (ok) setProducts((current) => (existing ? current.map((item) => (item.id === next.id ? next : item)) : [next, ...current]));
      return ok;
    },
    [products, run],
  );

  const deleteProduct = useCallback(
    async (product: Product) => {
      if (!supabase) return false;
      const client = supabase;
      const ok = await run(() => client.from('products').delete().eq('id', product.id), `${product.name} excluído`);
      if (ok) {
        setProducts((current) => current.filter((item) => item.id !== product.id));
        setPromotions((current) => current.filter((promotion) => promotion.productId !== product.id));
      }
      return ok;
    },
    [run],
  );

  const savePromotion = useCallback(
    async (promotion: Promotion, successText: string) => {
      if (!supabase) return false;
      const client = supabase;
      const ok = await run(() => client.from('promotions').upsert(promotionToRow(promotion)), successText);
      if (ok) {
        setPromotions((current) =>
          current.some((item) => item.id === promotion.id)
            ? current.map((item) => (item.id === promotion.id ? promotion : item))
            : [promotion, ...current],
        );
      }
      return ok;
    },
    [run],
  );

  const deletePromotion = useCallback(
    async (promotion: Promotion) => {
      if (!supabase) return false;
      const client = supabase;
      const ok = await run(() => client.from('promotions').delete().eq('id', promotion.id), 'Promoção excluída');
      if (ok) setPromotions((current) => current.filter((item) => item.id !== promotion.id));
      return ok;
    },
    [run],
  );

  const setOrderStatus = useCallback(
    async (order: AdminOrder, status: OrderStatus, successText: string) => {
      if (!supabase) return false;
      const client = supabase;
      const history = [...order.history, { s: status, at: Date.now() }];
      const ok = await run(
        () => client.from('orders').update({ status, history }).eq('id', order.id),
        successText,
      );
      if (ok) setOrders((current) => current.map((item) => (item.id === order.id ? { ...item, status, history } : item)));
      return ok;
    },
    [run],
  );

  return {
    products,
    promotions,
    settings,
    orders,
    loading,
    saving,
    savedAt,
    toast,
    notify,
    saveSettings,
    saveProduct,
    deleteProduct,
    savePromotion,
    deletePromotion,
    setOrderStatus,
  };
}

export type AdminData = ReturnType<typeof useAdminData>;
