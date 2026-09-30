import { useCallback, useEffect, useMemo } from 'react';
import { create } from 'zustand';
import type { AdminOrder } from '../../types/order';
import { formatCurrency } from '../../utils/currency';
import { useSoundStore } from './newOrderSound';

/**
 * Pedidos que este aparelho já processou, salvos no localStorage:
 * - `notified`: já tocou o alerta (nunca toca de novo pelo mesmo pedido);
 * - `seen`: o lojista já abriu ou dispensou (sai o destaque de "novo").
 */
const STORAGE_KEY = 'admin_order_alerts';
/** Enquanto houver pedido novo sem ver, o som se repete neste intervalo. */
const REMINDER_MS = 30_000;

interface AlertMemory {
  notified: number[];
  seen: number[];
}

function readMemory(): AlertMemory | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<AlertMemory>;
    return {
      notified: Array.isArray(parsed.notified) ? parsed.notified : [],
      seen: Array.isArray(parsed.seen) ? parsed.seen : [],
    };
  } catch {
    return null;
  }
}

function writeMemory(notified: Set<number>, seen: Set<number>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ notified: [...notified], seen: [...seen] }));
  } catch {
    // Sem localStorage: a memória vale só enquanto o painel estiver aberto.
  }
}

export function describeItems(order: AdminOrder): string {
  const count = order.items.reduce((sum, item) => sum + item.quantity, 0);
  return `${count} ${count === 1 ? 'item' : 'itens'}`;
}

/** Abre o pedido quando o lojista clica no aviso do navegador (definido pelo painel). */
let openFromNotification: (id: number) => void = () => {};

/** Aviso do sistema operacional, só com a aba em segundo plano e a permissão já dada. */
function showBrowserNotification(arrivals: AdminOrder[]) {
  if (!document.hidden || typeof Notification === 'undefined' || Notification.permission !== 'granted') return;
  const order = arrivals[0];
  const more = arrivals.length > 1 ? ` (+${arrivals.length - 1} novos)` : '';
  try {
    const notification = new Notification('🔔 Novo pedido recebido', {
      body: `Pedido #${order.id} — ${formatCurrency(order.total)}${more}\nClique para visualizar.`,
      tag: `pedido-${order.id}`,
      icon: '/apple-touch-icon.png',
    });
    notification.onclick = () => {
      window.focus();
      openFromNotification(order.id);
      notification.close();
    };
  } catch {
    // Alguns navegadores (Android) só criam avisos pelo service worker: o alerta na tela já basta.
  }
}

interface OrderAlertState {
  seen: Set<number>;
  markSeen: (id: number) => void;
  /**
   * Recebe cada leitura da lista de pedidos (Realtime ou recarga) e alerta os
   * que chegaram agora, identificados pelo id. Pedido que só mudou de etapa
   * não alerta de novo.
   */
  ingest: (orders: AdminOrder[]) => void;
}

/** `null` até a primeira leitura, que define a base do que já existia. */
let notified: Set<number> | null = null;

export const useOrderAlertStore = create<OrderAlertState>()((set, get) => ({
  seen: new Set(readMemory()?.seen ?? []),

  markSeen: (id) => {
    const { seen } = get();
    if (seen.has(id)) return;
    const next = new Set(seen).add(id);
    set({ seen: next });
    if (notified) writeMemory(notified, next);
  },

  ingest: (orders) => {
    const ids = new Set(orders.map((order) => order.id));

    if (!notified) {
      const memory = readMemory();
      if (!memory) {
        // Primeira vez neste aparelho: o que já está na lista não é novidade.
        notified = ids;
        set({ seen: new Set(ids) });
        writeMemory(ids, ids);
        return;
      }
      notified = new Set(memory.notified);
    }

    const known = notified;
    const arrivals = orders.filter((order) => !known.has(order.id) && order.status === 'novo');
    // Guarda só o que ainda está na lista, para a memória não crescer para sempre.
    notified = ids;
    const current = get().seen;
    const seen = new Set([...current].filter((id) => ids.has(id)));
    if (seen.size !== current.size) set({ seen });
    writeMemory(ids, seen);

    if (arrivals.length === 0) return;
    useSoundStore.getState().play();
    showBrowserNotification(arrivals);
  },
}));

/**
 * Estado dos alertas para a tela: pedidos novos ainda não abertos, o
 * lembrete sonoro enquanto houver algum e a liberação do áudio no primeiro
 * clique (política de autoplay).
 */
export function useOrderAlerts(orders: AdminOrder[], onOpen: (id: number) => void) {
  const seen = useOrderAlertStore((state) => state.seen);
  const markSeen = useOrderAlertStore((state) => state.markSeen);
  const soundEnabled = useSoundStore((state) => state.enabled);
  const soundBlocked = useSoundStore((state) => state.blocked);

  /** Pedidos ainda na etapa "novo" que o lojista não abriu: os mais recentes primeiro. */
  const unseenOrders = useMemo(
    () => orders.filter((order) => order.status === 'novo' && !seen.has(order.id)),
    [orders, seen],
  );
  const unseenIds = useMemo(() => new Set(unseenOrders.map((order) => order.id)), [unseenOrders]);

  const open = useCallback(
    (id: number) => {
      markSeen(id);
      onOpen(id);
    },
    [markSeen, onOpen],
  );

  useEffect(() => {
    openFromNotification = open;
  }, [open]);

  // Lembrete: repete o som até o lojista abrir ou dispensar o pedido.
  const waiting = unseenOrders.length > 0;
  useEffect(() => {
    if (!waiting || !soundEnabled) {
      useSoundStore.getState().stop();
      return;
    }
    const timer = setInterval(() => useSoundStore.getState().play(), REMINDER_MS);
    return () => clearInterval(timer);
  }, [waiting, soundEnabled]);

  // Libera o áudio no primeiro clique ou tecla do lojista. O botão de som
  // fica de fora: ele mesmo toca o teste, e liberar antes do clique faria o
  // botão achar que o som já estava ligado e desligá-lo.
  useEffect(() => {
    if (!soundBlocked) return;
    const unlock = (event: Event) => {
      if (event.target instanceof Element && event.target.closest('[data-sound-toggle]')) return;
      useSoundStore.getState().unlock();
    };
    window.addEventListener('pointerdown', unlock, true);
    window.addEventListener('keydown', unlock, true);
    return () => {
      window.removeEventListener('pointerdown', unlock, true);
      window.removeEventListener('keydown', unlock, true);
    };
  }, [soundBlocked]);

  return { unseenOrders, unseenIds, markSeen, open };
}
