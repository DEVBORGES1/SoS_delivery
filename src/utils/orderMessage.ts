import type { Order, OrderLine } from '../types/order';
import { formatCurrency } from './currency';
import { ORDER_TYPE_LABELS, PAYMENT_METHOD_LABELS, formatAddress } from './order';

const DIVIDER = '━━━━━━━━━━━━━━';

function formatLine(line: OrderLine): string[] {
  const rows = [`${line.emoji} ${line.name}`, `Quantidade: ${line.quantity}`];
  if (line.addons.length) rows.push(`Adicionais: ${line.addons.join(', ')}`);
  if (line.note) rows.push(`Obs.: ${line.note}`);
  rows.push(`Valor: ${formatCurrency(line.lineTotal)}`);
  return rows;
}

function formatTotals(order: Order): string[] {
  const rows = [`Subtotal: ${formatCurrency(order.subtotal)}`];
  if (order.customer.orderType === 'delivery') {
    rows.push(`Taxa de entrega: ${formatCurrency(order.deliveryFee)}`);
  }
  rows.push(`*Total: ${formatCurrency(order.total)}*`);
  return rows;
}

function formatCustomer(order: Order): string[] {
  const { customer } = order;
  const rows = [
    `Nome: ${customer.name.trim()}`,
    `Telefone: ${customer.phone}`,
    `Tipo: ${ORDER_TYPE_LABELS[customer.orderType]}`,
  ];

  if (customer.orderType === 'delivery') {
    rows.push('Endereço:', formatAddress(customer));
    if (customer.reference.trim()) rows.push(`Referência: ${customer.reference.trim()}`);
  }

  const change =
    customer.paymentMethod === 'cash' && customer.changeFor.trim()
      ? ` (troco para ${customer.changeFor.trim()})`
      : '';
  rows.push(`Pagamento: ${PAYMENT_METHOD_LABELS[customer.paymentMethod]}${change}`);

  if (customer.notes.trim()) rows.push('Observação:', customer.notes.trim());
  return rows;
}

/** Transforma o pedido no texto organizado enviado ao WhatsApp da loja. */
export function buildOrderMessage(order: Order): string {
  const sections = [
    ['Olá! Gostaria de fazer um pedido.', `Pedido #${order.id}`],
    ...order.items.map(formatLine),
    [DIVIDER, ...formatTotals(order)],
    formatCustomer(order),
  ];
  return sections.map((rows) => rows.join('\n')).join('\n\n');
}
