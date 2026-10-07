import { storeConfig } from '../../data/storeConfig';
import type { AdminOrder, OrderStatus, OrderType } from '../../types/order';
import { onlyDigits } from '../../utils/formatters';

export const ORDER_STATUS: Record<OrderStatus, { label: string; color: string }> = {
  novo: { label: 'Novo', color: 'var(--adm-st-novo)' },
  aceito: { label: 'Aceito · na chapa', color: 'var(--adm-st-aceito)' },
  preparando: { label: 'Preparando', color: 'var(--adm-st-preparando)' },
  saiu: { label: 'Saiu pra entrega', color: 'var(--adm-st-saiu)' },
  pronto: { label: 'Pronto pra retirada', color: 'var(--adm-st-saiu)' },
  concluido: { label: 'Concluído', color: 'var(--adm-st-concluido)' },
  cancelado: { label: 'Cancelado', color: 'var(--adm-st-cancelado)' },
};

export const ACTIVE_STATUSES: OrderStatus[] = ['novo', 'aceito', 'preparando', 'saiu', 'pronto'];

export const STEP_LABELS: Record<OrderStatus, string> = {
  novo: 'Recebido',
  aceito: 'Aceito · na chapa',
  preparando: 'Preparando',
  saiu: 'Saiu pra entrega',
  pronto: 'Pronto pra retirada',
  concluido: 'Concluído',
  cancelado: 'Cancelado',
};

const ACTION_LABELS: Partial<Record<OrderStatus, string>> = {
  aceito: 'Aceitar pedido',
  saiu: 'Saiu pra entrega',
  pronto: 'Pronto pra retirada',
  concluido: 'Concluir pedido',
};

/**
 * Etapas de cada tipo de pedido, na ordem. Aceitar já coloca o pedido na chapa:
 * não existe mais a etapa "preparando" separada.
 */
export function orderFlow(type: OrderType): OrderStatus[] {
  return type === 'pickup' ? ['novo', 'aceito', 'pronto', 'concluido'] : ['novo', 'aceito', 'saiu', 'concluido'];
}

/** Posição da etapa no fluxo. Pedidos antigos em "preparando" contam como aceitos. */
export function flowIndex(type: OrderType, status: OrderStatus): number {
  return orderFlow(type).indexOf(status === 'preparando' ? 'aceito' : status);
}

/** Próxima etapa do pedido, ou `null` se já foi concluído ou cancelado. */
export function nextStatus(order: AdminOrder): OrderStatus | null {
  if (order.status === 'cancelado') return null;
  const flow = orderFlow(order.orderType);
  const index = flowIndex(order.orderType, order.status);
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
export function customerMessage(order: AdminOrder, status: OrderStatus): string {
  const firstName = order.customerName.trim().split(' ')[0];
  /** ", Juninho" ou nada, quando o cliente não informou o nome. */
  const commaName = firstName ? `, ${firstName}` : '';
  const nextStep = order.orderType === 'pickup' ? 'estiver pronto para retirada' : 'sair para entrega';
  const address = `${storeConfig.address} — ${storeConfig.district}`;
  const id = `#${order.id}`;

  const messages: Record<OrderStatus, string> = {
    novo: '',
    aceito: `${firstName ? `Olá ${firstName}!` : 'Olá!'} Seu pedido foi aceito, assim que ${nextStep}, avisamos.`,
    preparando: `${firstName ? `${firstName}, seu` : 'Seu'} pedido ${id} já está NA CHAPA! Estamos preparando agora.`,
    saiu: 'Seu pedido saiu para entrega',
    pronto: `Seu pedido ${id} está PRONTO PARA RETIRADA na ${address}. Te esperamos!`,
    concluido: `Pedido ${id} finalizado. Obrigado pela preferência${commaName}! Bom apetite e até a próxima.`,
    cancelado: `Olá${commaName}. Infelizmente não conseguimos atender seu pedido ${id} agora. Pedimos desculpas — qualquer dúvida é só responder esta mensagem.`,
  };
  return messages[status];
}

/** Cor com transparência, para os fundos das etiquetas de status (aceita variáveis CSS). */
export function withAlpha(color: string, alpha: number): string {
  return `color-mix(in srgb, ${color} ${Math.round(alpha * 100)}%, transparent)`;
}
