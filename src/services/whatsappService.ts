import { useSettingsStore } from '../stores/settingsStore';
import type { Order } from '../types/order';
import { buildOrderMessage } from '../utils/orderMessage';

const WHATSAPP_BASE_URL = 'https://wa.me/';

/** Número que recebe os pedidos (definido no painel, em Loja). */
function storeWhatsapp(): string {
  return useSettingsStore.getState().settings.whatsapp;
}

function buildWhatsAppUrl(message: string, phone: string = storeWhatsapp()): string {
  return `${WHATSAPP_BASE_URL}${phone}?text=${encodeURIComponent(message)}`;
}

/** Link do botão flutuante e do rodapé ("Olá! Quero fazer um pedido."). */
export function getDirectChatUrl(phone?: string): string {
  return buildWhatsAppUrl('Olá! Quero fazer um pedido.', phone);
}

export function getOrderUrl(order: Order): string {
  return buildWhatsAppUrl(buildOrderMessage(order));
}

/**
 * Abre uma aba vazia na hora do clique (antes de qualquer espera, para o
 * navegador não bloquear) e devolve uma função que a leva ao WhatsApp.
 * Retorna `null` quando o navegador bloqueia a nova aba.
 */
export function reserveWhatsAppTab(): ((url: string) => void) | null {
  const tab = window.open('', '_blank');
  if (!tab) return null;
  try {
    tab.document.title = 'Abrindo o WhatsApp…';
    tab.document.body.style.cssText = 'font:16px system-ui,sans-serif;display:grid;place-items:center;height:100vh;margin:0';
    tab.document.body.textContent = 'Abrindo o WhatsApp…';
  } catch {
    // A aba pode não permitir escrita; o redirecionamento continua funcionando.
  }
  return (url) => {
    tab.opener = null;
    tab.location.href = url;
  };
}
