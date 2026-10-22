import type { Order, OrderTotals } from '../types/order';
import { formatAddress } from '../utils/order';
import { isSupabaseConfigured, supabaseConfig } from './supabaseConfig';

/** Sem resposta do banco nesse tempo, o pedido segue só pelo WhatsApp. */
const REQUEST_TIMEOUT_MS = 4000;

/** Pedido gravado: número oficial e, com o banco atualizado, os valores que ele calculou. */
export interface SavedOrder {
  id: number;
  /** `null` em bancos sem o schema.sql atualizado (aí valem os valores do site). */
  totals: OrderTotals | null;
  /** Bairro como está cadastrado no banco. */
  district: string;
}

export type SaveOrderResult =
  | { status: 'saved'; order: SavedOrder }
  /** O banco recusou o bairro (desativado ou fora da lista): o pedido não pode seguir. */
  | { status: 'invalid-district'; message: string }
  /** Supabase fora do ar ou não configurado: o pedido segue só pelo WhatsApp. */
  | { status: 'unavailable' };

/** Resposta do `create_order` (versões antigas do banco devolvem só o número). */
interface CreateOrderResponse {
  id: number;
  subtotal: number | string;
  delivery_fee: number | string;
  delivery_fee_original: number | string | null;
  free_delivery: boolean;
  delivery_district: string;
  total: number | string;
}

function parseResponse(body: unknown): SavedOrder | null {
  if (typeof body === 'number' || typeof body === 'string') {
    const id = Number(body);
    return Number.isFinite(id) ? { id, totals: null, district: '' } : null;
  }
  if (!body || typeof body !== 'object') return null;
  const row = body as CreateOrderResponse;
  const id = Number(row.id);
  if (!Number.isFinite(id)) return null;
  return {
    id,
    totals: {
      subtotal: Number(row.subtotal) || 0,
      deliveryFee: Number(row.delivery_fee) || 0,
      deliveryFeeOriginal: row.delivery_fee_original == null ? null : Number(row.delivery_fee_original) || 0,
      freeDelivery: row.free_delivery === true,
      total: Number(row.total) || 0,
    },
    district: row.delivery_district ?? '',
  };
}

/**
 * Grava o pedido no banco (função `create_order`) para ele aparecer no painel.
 * O banco recalcula a taxa de entrega com o bairro e a promoção que estão
 * valendo; os valores de entrega mandados aqui são só informativos.
 */
export async function saveOrder(order: Order): Promise<SaveOrderResult> {
  if (!isSupabaseConfigured) return { status: 'unavailable' };

  const { customer } = order;
  const isDelivery = customer.orderType === 'delivery';
  const payload = {
    customer_name: customer.name.trim(),
    customer_phone: customer.phone,
    order_type: customer.orderType,
    address: isDelivery ? formatAddress(customer) : '',
    district: isDelivery ? customer.district.trim() : '',
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
    if (!response.ok) {
      const error = (await response.json().catch(() => ({}))) as { hint?: string; message?: string };
      if (error.hint === 'delivery_zone') {
        return { status: 'invalid-district', message: error.message ?? 'Escolha um dos bairros atendidos.' };
      }
      throw new Error(`Supabase respondeu ${response.status}`);
    }
    const saved = parseResponse(await response.json());
    return saved ? { status: 'saved', order: saved } : { status: 'unavailable' };
  } catch (error) {
    console.warn('Pedido não foi salvo no painel; segue só pelo WhatsApp.', error);
    return { status: 'unavailable' };
  } finally {
    clearTimeout(timer);
  }
}
