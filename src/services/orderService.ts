import type { Order } from '../types/order';
import { formatAddress } from '../utils/order';
import { isSupabaseConfigured, supabaseConfig } from './supabaseConfig';

/** Sem resposta do banco nesse tempo, o pedido segue só pelo WhatsApp. */
const REQUEST_TIMEOUT_MS = 4000;

/**
 * Grava o pedido no banco (função `create_order`) para ele aparecer no painel.
 * Retorna o número do pedido, ou `null` se o Supabase não estiver configurado
 * ou não responder — nesse caso o pedido segue só pelo WhatsApp.
 */
export async function saveOrder(order: Order): Promise<number | null> {
  if (!isSupabaseConfigured) return null;

  const { customer } = order;
  const isDelivery = customer.orderType === 'delivery';
  const payload = {
    customer_name: customer.name.trim(),
    customer_phone: customer.phone,
    order_type: customer.orderType,
    address: isDelivery ? formatAddress(customer) : '',
    reference: isDelivery ? customer.reference.trim() : '',
    payment_method: customer.paymentMethod,
    change_for: customer.paymentMethod === 'cash' ? customer.changeFor.trim() : '',
    notes: customer.notes.trim(),
    items: order.items.map(({ name, quantity, addons, note, lineTotal }) => ({ name, quantity, addons, note, lineTotal })),
    subtotal: order.subtotal,
    delivery_fee: order.deliveryFee,
    total: order.total,
  };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(`${supabaseConfig.url}/rest/v1/rpc/create_order`, {
      method: 'POST',
      headers: { apikey: supabaseConfig.key, 'Content-Type': 'application/json' },
      body: JSON.stringify({ payload }),
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`Supabase respondeu ${response.status}`);
    const id = Number(await response.json());
    return Number.isFinite(id) ? id : null;
  } catch (error) {
    console.warn('Pedido não foi salvo no painel; segue só pelo WhatsApp.', error);
    return null;
  } finally {
    clearTimeout(timer);
  }
}
