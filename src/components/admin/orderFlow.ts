import { storeConfig } from '../../data/storeConfig';
import type { AdminOrder, OrderStatus, OrderType } from '../../types/order';
import { formatCurrency } from '../../utils/currency';
import { onlyDigits } from '../../utils/formatters';
import { PAYMENT_METHOD_LABELS } from '../../utils/order';

export const ORDER_STATUS: Record<OrderStatus, { label: string; color: string }> = {
  novo: { label: 'Novo', color: '#d3301f' },
  aceito: { label: 'Aceito', color: '#8a5a00' },
  preparando: { label: 'Preparando', color: '#b54f00' },
  saiu: { label: 'Saiu pra entrega', color: '#1f5fbf' },
  pronto: { label: 'Pronto pra retirada', color: '#1f5fbf' },
  concluido: { label: 'Concluído', color: '#178a45' },
  cancelado: { label: 'Cancelado', color: '#6a5c4d' },
};

export const ACTIVE_STATUSES: OrderStatus[] = ['novo', 'aceito', 'preparando', 'saiu', 'pronto'];

export const STEP_LABELS: Record<OrderStatus, string> = {
  novo: 'Recebido',
  aceito: 'Aceito',
  preparando: 'Preparando',
  saiu: 'Saiu pra entrega',
  pronto: 'Pronto pra retirada',
  concluido: 'Concluído',
  cancelado: 'Cancelado',
};

const ACTION_LABELS: Partial<Record<OrderStatus, string>> = {
  aceito: 'Aceitar pedido',
  preparando: 'Iniciar preparo',
  saiu: 'Saiu pra entrega',
  pronto: 'Pronto pra retirada',
  concluido: 'Concluir pedido',
};

/** Etapas de cada tipo de pedido, na ordem. */
export function orderFlow(type: OrderType): OrderStatus[] {
  return type === 'pickup'
    ? ['novo', 'aceito', 'preparando', 'pronto', 'concluido']
    : ['novo', 'aceito', 'preparando', 'saiu', 'concluido'];
}

/** Próxima etapa do pedido, ou `null` se já foi concluído ou cancelado. */
export function nextStatus(order: AdminOrder): OrderStatus | null {
  if (order.status === 'cancelado') return null;
  const flow = orderFlow(order.orderType);
  const index = flow.indexOf(order.status);
  return index >= 0 && index < flow.length - 1 ? flow[index + 1] : null;
}

export function actionLabel(status: OrderStatus): string {
  return `${ACTION_LABELS[status] ?? STEP_LABELS[status]} e avisar`;
}

/** Link do WhatsApp do cliente com a mensagem pronta. */
export function customerWhatsAppUrl(phone: string, text: string): string {
  let digits = onlyDigits(phone);
  if (digits.length <= 11) digits = `55${digits}`;
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}

/** Mensagem enviada ao cliente quando o pedido muda de etapa. */
export function customerMessage(order: AdminOrder, status: OrderStatus, deliveryEta: string): string {
  const firstName = order.customerName.trim().split(' ')[0] || 'tudo bem';
  const payment =
    PAYMENT_METHOD_LABELS[order.paymentMethod] + (order.changeFor ? ` (troco p/ ${order.changeFor})` : '');
  const address = `${storeConfig.address} — ${storeConfig.district}`;
  const id = `#${order.id}`;

  const messages: Record<OrderStatus, string> = {
    novo: '',
    aceito: `Olá, ${firstName}! Aqui é da ${storeConfig.name}. Seu pedido ${id} foi ACEITO e já entrou na fila. Total: ${formatCurrency(order.total)}. A gente avisa cada etapa por aqui.`,
    preparando: `${firstName}, seu pedido ${id} já está NA CHAPA! Estamos preparando agora.`,
    saiu: `Seu pedido ${id} SAIU PARA ENTREGA! Chega em ${deliveryEta.replace(/^~/, 'cerca de ')}. Pagamento na entrega: ${payment}.`,
    pronto: `Seu pedido ${id} está PRONTO PARA RETIRADA na ${address}. Te esperamos!`,
    concluido: `Pedido ${id} finalizado. Obrigado pela preferência, ${firstName}! Bom apetite e até a próxima.`,
    cancelado: `Olá, ${firstName}. Infelizmente não conseguimos atender seu pedido ${id} agora. Pedimos desculpas — qualquer dúvida é só responder esta mensagem.`,
  };
  return messages[status];
}

/** Cor com transparência, para os fundos das etiquetas de status. */
export function withAlpha(hex: string, alpha: number): string {
  const value = parseInt(hex.slice(1), 16);
  return `rgba(${value >> 16}, ${(value >> 8) & 255}, ${value & 255}, ${alpha})`;
}
