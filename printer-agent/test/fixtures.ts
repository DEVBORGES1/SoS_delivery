import type { OrderTicket } from '../src/validate.ts';

/** Pedido de entrega com adicionais, observações e acentos. */
export function deliveryTicket(overrides: Partial<OrderTicket> = {}): OrderTicket {
  return {
    store: 'S.O.S Delivery Videira',
    orderId: 1025,
    createdAt: new Date(2026, 8, 30, 18, 42).getTime(),
    acceptedAt: new Date(2026, 8, 30, 18, 45).getTime(),
    orderType: 'delivery',
    customerName: 'João Vitor',
    customerPhone: '49999998888',
    items: [
      { quantity: 2, name: 'X-Bacon', addons: ['Bacon', 'Cheddar'], note: 'Sem cebola' },
      { quantity: 1, name: 'Combate Duplo', addons: [], note: 'Ponto da carne bem passado' },
      { quantity: 1, name: 'Batata Frita', addons: [], note: '' },
    ],
    subtotal: 79.7,
    deliveryFee: 10,
    total: 89.7,
    paymentMethod: 'pix',
    changeFor: '',
    address: 'Rua Exemplo, 123 — Centro (Apto 2)',
    reference: 'Casa azul, portão de madeira',
    city: 'Videira - SC',
    notes: 'Entregar na frente da casa.',
    ...overrides,
  };
}

export function pickupTicket(overrides: Partial<OrderTicket> = {}): OrderTicket {
  return deliveryTicket({
    orderId: 1026,
    orderType: 'pickup',
    deliveryFee: 0,
    subtotal: 79.7,
    total: 79.7,
    paymentMethod: 'cash',
    changeFor: 'R$ 100,00',
    address: '',
    reference: '',
    notes: '',
    ...overrides,
  });
}
