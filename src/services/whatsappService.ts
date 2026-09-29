import { storeConfig } from '../data/storeConfig';
import type { Order } from '../types/order';
import { buildOrderMessage } from '../utils/orderMessage';

const WHATSAPP_BASE_URL = 'https://wa.me/';

function buildWhatsAppUrl(message: string, phone: string = storeConfig.whatsapp): string {
  return `${WHATSAPP_BASE_URL}${phone}?text=${encodeURIComponent(message)}`;
}

/** Link do botão flutuante e do rodapé ("Olá! Quero fazer um pedido."). */
export function getDirectChatUrl(): string {
  return buildWhatsAppUrl('Olá! Quero fazer um pedido.');
}

export function getOrderUrl(order: Order): string {
  return buildWhatsAppUrl(buildOrderMessage(order));
}

/**
 * Abre a conversa com o pedido em uma nova aba. Retorna `false` quando o
 * navegador bloqueia a abertura, para a interface exibir o estado de erro.
 */
export function openWhatsApp(url: string): boolean {
  const popup = window.open(url, '_blank');
  if (!popup) return false;
  popup.opener = null;
  return true;
}
