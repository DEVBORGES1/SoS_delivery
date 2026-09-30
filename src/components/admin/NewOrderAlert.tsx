import { Bell, X } from 'lucide-react';
import type { AdminOrder } from '../../types/order';
import { cn } from '../../utils/cn';
import { formatCurrency } from '../../utils/currency';
import { BTN_PRIMARY, MUTED } from './adminUi';
import { describeItems } from './useOrderAlerts';

interface NewOrderAlertProps {
  /** Pedidos novos que o lojista ainda não abriu, os mais recentes primeiro. */
  orders: AdminOrder[];
  onOpen: (id: number) => void;
  onDismiss: (id: number) => void;
}

/** Cartão "Novo pedido!" no topo da tela, até o lojista abrir ou dispensar o pedido. */
export function NewOrderAlert({ orders, onOpen, onDismiss }: NewOrderAlertProps) {
  const order = orders[0];
  if (!order) return null;
  const others = orders.length - 1;

  return (
    <div
      key={order.id}
      role="alert"
      className="fixed inset-x-3 top-[68px] z-70 motion-safe:animate-order-in min-[960px]:top-[88px] min-[960px]:right-6 min-[960px]:left-auto min-[960px]:w-[340px]"
    >
      <div className="rounded-[18px] border-[1.5px] border-(--adm-new-border) bg-(--adm-card) p-4 text-(--adm-ink) shadow-[0_18px_44px_-16px_rgba(0,0,0,.45)]">
        <div className="flex items-center gap-2.5">
          <span className="grid size-9 flex-none place-items-center rounded-full bg-(--adm-accent) text-white">
            <Bell size={18} aria-hidden="true" />
          </span>
          <span className="flex-1 font-display text-[22px] leading-none uppercase">Novo pedido!</span>
          <button
            type="button"
            onClick={() => onDismiss(order.id)}
            aria-label={`Dispensar alerta do pedido #${order.id}`}
            className="grid size-9 flex-none cursor-pointer place-items-center rounded-full bg-(--adm-soft) text-(--adm-ink)"
          >
            <X size={16} aria-hidden="true" />
          </button>
        </div>

        <div className="mt-3 flex items-baseline justify-between gap-3">
          <span className="text-[17px] font-extrabold">Pedido #{order.id}</span>
          <span className="text-[17px] font-extrabold">{formatCurrency(order.total)}</span>
        </div>
        <div className="mt-0.5 truncate font-bold">{order.customerName}</div>
        <div className={cn('text-[13px]', MUTED)}>
          {describeItems(order)} · {order.orderType === 'delivery' ? 'Entrega' : 'Retirada'}
        </div>
        {others > 0 && (
          <div className="mt-2 text-[13px] font-bold text-(--adm-accent)">
            + {others} {others === 1 ? 'outro pedido novo' : 'outros pedidos novos'}
          </div>
        )}

        <button type="button" onClick={() => onOpen(order.id)} className={cn(BTN_PRIMARY, 'mt-3.5 w-full')}>
          VER PEDIDO
        </button>
      </div>
    </div>
  );
}
