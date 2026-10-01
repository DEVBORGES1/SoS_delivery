import type { Codepage } from './codepages.ts';
import { CODEPAGES } from './codepages.ts';
import { TicketDocument } from './escpos.ts';
import type { OrderTicket, PaymentMethod } from './validate.ts';

const PAYMENT_LABELS: Record<PaymentMethod, string> = {
  pix: 'PIX',
  cash: 'DINHEIRO',
  card: 'CARTÃO',
};

const pad = (value: number) => String(value).padStart(2, '0');

/** 1790000000000 → "30/09/2026" (fuso do computador da loja). */
export function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}`;
}

/** 1790000000000 → "18:42". */
export function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/** 1234.5 → "R$ 1.234,50". */
export function formatMoney(value: number): string {
  const [integer, cents] = value.toFixed(2).split('.');
  return `R$ ${integer.replace(/\B(?=(\d{3})+(?!\d))/g, '.')},${cents}`;
}

/** "5549999998888" ou "49999998888" → "(49) 99999-8888". */
function formatPhone(phone: string): string {
  let digits = phone.replace(/\D/g, '');
  if (digits.length > 11 && digits.startsWith('55')) digits = digits.slice(2);
  if (digits.length === 11) return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  if (digits.length === 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return phone;
}

export interface LayoutOptions {
  columns: number;
  codepage: Codepage;
  /** Segunda via: a cozinha precisa saber que não é um pedido novo. */
  reprint?: boolean;
}

/** Comanda de cozinha/balcão de um pedido aceito. */
export function buildOrderTicket(ticket: OrderTicket, options: LayoutOptions): TicketDocument {
  const doc = new TicketDocument(options.columns, options.codepage);
  const delivery = ticket.orderType === 'delivery';

  doc.rule('=');
  doc.text(ticket.store.toUpperCase(), { align: 'center', bold: true, size: 'tall' });
  doc.text(`PEDIDO #${ticket.orderId}`, { align: 'center', bold: true, size: 'big' });
  if (options.reprint) doc.text(' 2ª VIA - REIMPRESSÃO ', { align: 'center', bold: true, invert: true });
  doc.pair(`DATA: ${formatDate(ticket.createdAt)}`, `HORA: ${formatTime(ticket.createdAt)}`);
  doc.rule('=');

  doc.text(delivery ? ' ENTREGA ' : ' RETIRADA ', { align: 'center', bold: true, size: 'big', invert: true });
  doc.blank();
  doc.text('CLIENTE:');
  doc.text(ticket.customerName, { bold: true, size: 'tall' });
  if (ticket.customerPhone) doc.text(`Tel: ${formatPhone(ticket.customerPhone)}`);
  doc.rule();

  ticket.items.forEach((item, index) => {
    if (index > 0) doc.blank();
    const quantity = `${item.quantity}x `;
    doc.text(`${quantity}${item.name.toUpperCase()}`, { bold: true, size: 'tall' }, ' '.repeat(quantity.length));
    for (const addon of item.addons) doc.text(`  + ${addon}`, {}, '    ');
    if (item.note) doc.text(`  OBS: ${item.note}`, { bold: true }, '    ');
  });
  doc.rule();

  if (delivery || ticket.subtotal !== ticket.total) {
    doc.pair('Subtotal', formatMoney(ticket.subtotal));
    if (delivery) doc.pair('Entrega', ticket.deliveryFee ? formatMoney(ticket.deliveryFee) : 'Grátis');
  }
  doc.pair('TOTAL', formatMoney(ticket.total), { bold: true, size: 'tall' });
  doc.rule();

  doc.text('PAGAMENTO:');
  doc.text(PAYMENT_LABELS[ticket.paymentMethod], { bold: true, size: 'tall' });
  if (ticket.paymentMethod === 'cash' && ticket.changeFor) doc.text(`Troco para: ${ticket.changeFor}`, { bold: true });

  if (delivery) {
    doc.rule();
    doc.text('ENDEREÇO:');
    doc.text(ticket.address || '(não informado)', { bold: true });
    if (ticket.reference) doc.text(`Ref: ${ticket.reference}`);
    if (ticket.city) doc.text(ticket.city);
  }

  if (ticket.notes) {
    doc.rule();
    doc.text('OBSERVAÇÃO:');
    doc.text(ticket.notes, { bold: true });
  }

  doc.rule('=');
  doc.text('PEDIDO ACEITO', { align: 'center', bold: true, size: 'big' });
  if (ticket.acceptedAt) doc.text(`Aceito às ${formatTime(ticket.acceptedAt)}`, { align: 'center' });
  doc.rule('=');
  return doc;
}

/** Página do botão "Imprimir teste" das configurações. */
export function buildTestTicket(printerName: string, options: LayoutOptions, now = Date.now()): TicketDocument {
  const doc = new TicketDocument(options.columns, options.codepage);
  doc.rule('=');
  doc.text('TESTE DE IMPRESSÃO', { align: 'center', bold: true, size: 'tall' });
  doc.text('Impressora funcionando corretamente.', { align: 'center' });
  doc.blank();
  doc.text(`Data: ${formatDate(now)}`);
  doc.text(`Hora: ${formatTime(now)}`);
  doc.rule();
  doc.text('Acentos: ÁÉÍÓÚ ÂÊÔ ÃÕ Ç');
  doc.text('         áéíóú âêô ãõ ç');
  doc.text(`Tabela: ${CODEPAGES[options.codepage].label}`);
  doc.text(`Impressora: ${printerName}`);
  doc.rule();
  doc.text('Normal');
  doc.text('Negrito', { bold: true });
  doc.text('Altura dupla', { size: 'tall' });
  doc.text('GRANDE', { size: 'big', bold: true });
  doc.text(' Invertido ', { invert: true });
  doc.rule('=');
  return doc;
}
