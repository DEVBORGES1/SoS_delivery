import { ArrowLeft, MessageCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import type { AdminOrder, OrderStatus } from '../../types/order';
import { cn } from '../../utils/cn';
import { formatCurrency } from '../../utils/currency';
import { onlyDigits } from '../../utils/formatters';
import { PAYMENT_METHOD_LABELS } from '../../utils/order';
import { formatAgo, formatClockTime } from './adminFormat';
import { Chips, ConfirmButton, EYEBROW, MUTED } from './adminUi';
import {
  ACTIVE_STATUSES,
  ORDER_STATUS,
  STEP_LABELS,
  actionLabel,
  customerMessage,
  customerWhatsAppUrl,
  nextStatus,
  orderFlow,
  withAlpha,
} from './orderFlow';
import type { AdminData } from './useAdminData';

type OrderFilter = 'ativos' | 'novos' | 'concluidos' | 'cancelados';

const FILTERS: { id: OrderFilter; label: string; match: (order: AdminOrder) => boolean }[] = [
  { id: 'ativos', label: 'Em andamento', match: (order) => ACTIVE_STATUSES.includes(order.status) },
  { id: 'novos', label: 'Novos', match: (order) => order.status === 'novo' },
  { id: 'concluidos', label: 'Concluídos', match: (order) => order.status === 'concluido' },
  { id: 'cancelados', label: 'Cancelados', match: (order) => order.status === 'cancelado' },
];

function StatusPill({ status, className }: { status: OrderStatus; className?: string }) {
  const { label, color } = ORDER_STATUS[status];
  return (
    <span
      className={cn('rounded-full px-2.5 py-1 text-xs font-extrabold whitespace-nowrap', className)}
      style={{ background: withAlpha(color, 0.12), color }}
    >
      {label}
    </span>
  );
}

/** Reavalia os "há X min" a cada 30 s. */
function useNow(intervalMs = 30_000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(timer);
  }, [intervalMs]);
  return now;
}

interface OrderDetailProps {
  order: AdminOrder;
  deliveryEta: string;
  saving: boolean;
  narrow: boolean;
  now: number;
  onClose: () => void;
  onStatus: AdminData['setOrderStatus'];
  onDelete: () => void;
}

function OrderDetail({ order, deliveryEta, saving, narrow, now, onClose, onStatus, onDelete }: OrderDetailProps) {
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const flow = orderFlow(order.orderType);
  const currentIndex = flow.indexOf(order.status);
  const cancelled = order.status === 'cancelado';
  const next = nextStatus(order);
  const message = next ? customerMessage(order, next, deliveryEta) : '';
  const cancelMessage = customerMessage(order, 'cancelado', deliveryEta);
  const firstName = order.customerName.split(' ')[0];

  return (
    <section
      aria-label="Detalhes do pedido"
      className={cn(
        'flex flex-col overflow-auto border border-[#e4dccf] bg-white',
        narrow ? 'fixed inset-0 z-61 rounded-none' : 'sticky top-24 max-h-[calc(100vh-120px)] rounded-[18px]',
      )}
    >
      <div className="sticky top-0 z-2 flex items-center gap-3 border-b border-[#efe8dd] bg-white px-[18px] py-3.5">
        {narrow && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Voltar para a lista"
            className="grid size-11 flex-none cursor-pointer place-items-center rounded-full bg-[#f4efe7] text-[#1c1611]"
          >
            <ArrowLeft size={18} aria-hidden="true" />
          </button>
        )}
        <div className="min-w-0 flex-1">
          <div className="font-display text-[26px] leading-[1.2]">PEDIDO #{order.id}</div>
          <div className={cn('text-[13px]', MUTED)}>
            Recebido às {formatClockTime(order.createdAt)} · {formatAgo(order.createdAt, now)}
          </div>
        </div>
        <StatusPill status={order.status} className="px-[11px] py-[5px]" />
      </div>

      <div className="flex flex-col gap-[18px] p-[18px]">
        <ol aria-label="Etapas" className="m-0 grid list-none grid-cols-5 gap-1 p-0">
          {flow.map((step, index) => {
            const reached = !cancelled && index <= currentIndex;
            const current = index === currentIndex;
            return (
              <li key={step} className="flex flex-col gap-1.5">
                <span
                  className="h-1.5 rounded-[9px]"
                  style={{
                    background: !reached ? '#e4dccf' : current ? ORDER_STATUS[step].color : '#1c1611',
                  }}
                />
                <span
                  className={cn(
                    'text-[11.5px] leading-[1.25]',
                    current ? 'font-extrabold' : 'font-semibold',
                    reached ? 'text-[#1c1611]' : 'text-[#9c8f80]',
                  )}
                >
                  {STEP_LABELS[step]}
                </span>
              </li>
            );
          })}
        </ol>

        {next ? (
          <div className="flex flex-col gap-3 rounded-2xl bg-[#f4efe7] p-4">
            <div className={EYEBROW}>MENSAGEM PARA O CLIENTE</div>
            <div className="max-w-full self-start rounded-[4px_14px_14px_14px] bg-[#dcf5e3] px-3.5 py-2.5 text-[14.5px] leading-[1.45] whitespace-pre-wrap text-[#10331d] shadow-[0_1px_1px_rgba(0,0,0,.08)]">
              {message}
            </div>
            <a
              href={customerWhatsAppUrl(order.customerPhone, message)}
              target="_blank"
              rel="noopener noreferrer"
              aria-disabled={saving}
              onClick={() => {
                setConfirmCancel(false);
                void onStatus(order, next, `Pedido #${order.id}: ${ORDER_STATUS[next].label} · WhatsApp aberto`);
              }}
              className="flex h-14 items-center justify-center gap-2.5 rounded-[14px] bg-[#178a45] text-[15px] font-extrabold tracking-[.03em] text-white shadow-[0_10px_24px_-12px_rgba(23,138,69,.8)] hover:brightness-110"
            >
              <MessageCircle size={20} aria-hidden="true" />
              {actionLabel(next)}
            </a>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className={cn('max-w-[360px] text-[12.5px]', MUTED)}>
                Abre o WhatsApp com a mensagem pronta. É só apertar enviar.
              </span>
              <a
                href={confirmCancel ? customerWhatsAppUrl(order.customerPhone, cancelMessage) : '#'}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(event) => {
                  if (!confirmCancel) {
                    event.preventDefault();
                    setConfirmCancel(true);
                    return;
                  }
                  setConfirmCancel(false);
                  void onStatus(order, 'cancelado', `Pedido #${order.id} cancelado · WhatsApp aberto`);
                }}
                className={cn(
                  'flex h-10 items-center rounded-[10px] border-[1.5px] border-[#d3301f] px-3.5 text-[13px] font-extrabold',
                  confirmCancel ? 'bg-[#d3301f] text-white' : 'bg-white text-[#d3301f]',
                )}
              >
                {confirmCancel
                  ? 'Confirmar e avisar cliente'
                  : order.status === 'novo'
                    ? 'Recusar pedido'
                    : 'Cancelar pedido'}
              </a>
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-[14px] bg-[#f4efe7] px-4 py-3">
            <span className="text-sm font-bold">
              {cancelled ? 'Pedido cancelado — o cliente foi avisado.' : 'Pedido concluído. Tudo certo!'}
            </span>
            <ConfirmButton
              label="Excluir pedido"
              confirmLabel="Confirmar exclusão"
              confirming={confirmDelete}
              disabled={saving}
              onClick={() => (confirmDelete ? onDelete() : setConfirmDelete(true))}
              className="h-10 rounded-[10px] px-3.5 text-[13px]"
            />
          </div>
        )}

        <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,200px),1fr))] gap-3.5">
          <div>
            <div className={EYEBROW}>CLIENTE</div>
            <div className="mt-1 text-base font-extrabold">{order.customerName}</div>
            <div className="mt-0.5 flex gap-3 text-sm font-bold">
              <a href={`tel:${onlyDigits(order.customerPhone)}`} className="text-[#d3301f]">
                {order.customerPhone}
              </a>
              <a
                href={customerWhatsAppUrl(order.customerPhone, `Olá, ${firstName}! Sobre seu pedido #${order.id}:`)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#178a45]"
              >
                Conversar
              </a>
            </div>
          </div>
          <div>
            <div className={EYEBROW}>{order.orderType === 'delivery' ? 'ENTREGA' : 'RETIRADA NO BALCÃO'}</div>
            <div className="mt-1 text-[14.5px] leading-[1.45]">
              {order.orderType === 'delivery'
                ? `${order.address}${order.reference ? ` · Ref: ${order.reference}` : ''}`
                : 'Cliente vem buscar'}
            </div>
          </div>
          <div>
            <div className={EYEBROW}>PAGAMENTO</div>
            <div className="mt-1 text-[14.5px] font-bold">
              {PAYMENT_METHOD_LABELS[order.paymentMethod]}
              {order.changeFor ? ` · troco p/ ${order.changeFor}` : ''}
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-[14px] border border-[#efe8dd]">
          {order.items.map((item, index) => (
            <div key={index} className="flex gap-3 border-b border-[#efe8dd] px-3.5 py-3 text-[14.5px]">
              <span className="min-w-[26px] font-extrabold">{item.quantity}×</span>
              <div className="min-w-0 flex-1">
                <div className="font-bold">{item.name}</div>
                {item.addons?.length > 0 && <div className={cn('text-[13px]', MUTED)}>+ {item.addons.join(', ')}</div>}
                {item.note && <div className="text-[13px] font-semibold text-[#b3261e]">Obs: {item.note}</div>}
              </div>
              <span className="font-bold whitespace-nowrap">{formatCurrency(item.lineTotal)}</span>
            </div>
          ))}
          <div className="flex flex-col gap-1 bg-[#faf7f2] px-3.5 py-3 text-sm">
            <div className={cn('flex justify-between', MUTED)}>
              <span>Subtotal</span>
              <span>{formatCurrency(order.subtotal)}</span>
            </div>
            {order.orderType === 'delivery' && (
              <div className={cn('flex justify-between', MUTED)}>
                <span>Entrega</span>
                <span>{order.deliveryFee ? formatCurrency(order.deliveryFee) : 'Grátis'}</span>
              </div>
            )}
            <div className="mt-1 flex justify-between text-[17px] font-extrabold">
              <span>Total</span>
              <span>{formatCurrency(order.total)}</span>
            </div>
          </div>
        </div>

        {order.notes && (
          <div className="rounded-xl border border-[#f2d68a] bg-[#fff6dc] px-3.5 py-3 text-sm">
            <b>Observação do cliente:</b> {order.notes}
          </div>
        )}

        <div>
          <div className={cn(EYEBROW, 'mb-2')}>HISTÓRICO</div>
          {[...order.history].reverse().map((entry, index) => (
            <div key={index} className="flex justify-between gap-2.5 border-t border-[#efe8dd] py-2 text-sm">
              <span className="flex items-center gap-2">
                <span
                  className="size-2 rounded-full"
                  style={{ background: ORDER_STATUS[entry.s]?.color ?? '#6a5c4d' }}
                />
                {entry.s === 'novo' ? 'Pedido recebido' : (ORDER_STATUS[entry.s]?.label ?? entry.s)}
              </span>
              <span className={cn('tabular-nums', MUTED)}>{formatClockTime(entry.at)}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

interface OrdersTabProps {
  data: AdminData;
  filter: OrderFilter;
  onFilter: (filter: OrderFilter) => void;
}

export type { OrderFilter };

export function OrdersTab({ data, filter, onFilter }: OrdersTabProps) {
  const wide = useMediaQuery('(min-width: 1180px)');
  const now = useNow();
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const { orders } = data;

  const match = FILTERS.find((item) => item.id === filter)?.match ?? (() => true);
  const list = orders.filter(match);
  const selected = list.find((order) => order.id === selectedId) ?? (wide ? list[0] : undefined);

  // Fim do turno: limpar de uma vez os concluídos ou os cancelados.
  const [confirmClear, setConfirmClear] = useState(false);
  const clearable = filter === 'concluidos' || filter === 'cancelados';
  const clearLabel = filter === 'concluidos' ? 'concluídos' : 'cancelados';
  const listTotal = list.reduce((sum, order) => sum + order.total, 0);

  const clearList = async () => {
    if (!confirmClear) {
      setConfirmClear(true);
      setTimeout(() => setConfirmClear(false), 4000);
      return;
    }
    setConfirmClear(false);
    const count = list.length;
    await data.deleteOrders(
      list.map((order) => order.id),
      `${count} ${count === 1 ? 'pedido excluído' : 'pedidos excluídos'}`,
    );
  };

  return (
    <div className="flex flex-col gap-4">
      <Chips
        ariaLabel="Filtrar pedidos"
        value={filter}
        onChange={(id) => {
          onFilter(id);
          setSelectedId(null);
          setConfirmClear(false);
        }}
        options={FILTERS.map(({ id, label, match: test }) => ({ id, label, count: orders.filter(test).length }))}
      />
      {clearable && list.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#e4dccf] bg-white px-[18px] py-3.5">
          <div>
            <div className="text-[15px] font-extrabold">
              {list.length} {list.length === 1 ? 'pedido' : 'pedidos'}
              {filter === 'concluidos' && ` · ${formatCurrency(listTotal)}`}
            </div>
            <div className={cn('text-[13px]', MUTED)}>Terminou o turno? Limpe a lista para começar o próximo do zero.</div>
          </div>
          <ConfirmButton
            label={`Limpar ${clearLabel}`}
            confirmLabel={`Excluir ${list.length} ${list.length === 1 ? 'pedido' : 'pedidos'}`}
            confirming={confirmClear}
            disabled={data.saving}
            onClick={() => void clearList()}
            className="h-11 rounded-[10px]"
          />
        </div>
      )}
      <div className="grid items-start gap-4 min-[1180px]:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
        <div className="flex min-w-0 flex-col gap-2.5">
          {list.map((order) => {
            const isSelected = selected?.id === order.id;
            return (
              <button
                key={order.id}
                type="button"
                onClick={() => setSelectedId(order.id)}
                className={cn(
                  'flex w-full cursor-pointer flex-col gap-1.5 rounded-2xl border-2 bg-white px-[18px] py-4 text-left text-[#1c1611] transition-colors duration-200 hover:border-[#1c1611]',
                  isSelected ? 'border-[#1c1611]' : order.status === 'novo' ? 'border-[#f0b3ab]' : 'border-[#e4dccf]',
                )}
              >
                <div className="flex items-center justify-between gap-2.5">
                  <span className="flex items-center gap-2">
                    <span className="text-[17px] font-extrabold">#{order.id}</span>
                    {order.status === 'novo' && (
                      <span className="rounded-[5px] bg-[#d3301f] px-[7px] py-0.5 text-[11px] font-extrabold tracking-[.04em] text-white">
                        NOVO
                      </span>
                    )}
                  </span>
                  <StatusPill status={order.status} />
                </div>
                <div className="flex justify-between gap-2.5 text-[15px]">
                  <span className="font-bold">{order.customerName}</span>
                  <span className="font-extrabold">{formatCurrency(order.total)}</span>
                </div>
                <div className={cn('text-[13px]', MUTED)}>
                  {order.orderType === 'delivery' ? 'Entrega' : 'Retirada'} · {formatAgo(order.createdAt, now)}
                </div>
                <div className={cn('truncate text-[13px]', MUTED)}>
                  {order.items.map((item) => `${item.quantity}× ${item.name}`).join(', ')}
                </div>
              </button>
            );
          })}
          {list.length === 0 && (
            <div className={cn('rounded-2xl border-[1.5px] border-dashed border-[#d8cdbd] bg-white px-5 py-10 text-center', MUTED)}>
              Nenhum pedido aqui. Novos pedidos do site aparecem sozinhos.
            </div>
          )}
        </div>

        {selected && (
          <OrderDetail
            key={selected.id}
            order={selected}
            deliveryEta={data.settings.deliveryEta}
            saving={data.saving}
            narrow={!wide}
            now={now}
            onClose={() => setSelectedId(null)}
            onStatus={data.setOrderStatus}
            onDelete={() => {
              setSelectedId(null);
              void data.deleteOrders([selected.id], `Pedido #${selected.id} excluído`);
            }}
          />
        )}
      </div>
    </div>
  );
}
