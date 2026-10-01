/**
 * Validação do que chega em POST /print. O agente nunca recebe bytes prontos:
 * só os dados do pedido, com tamanhos e tipos conferidos. A comanda é montada aqui.
 */
export type OrderType = 'delivery' | 'pickup';
export type PaymentMethod = 'pix' | 'cash' | 'card';

export interface TicketItem {
  quantity: number;
  name: string;
  addons: string[];
  note: string;
}

export interface OrderTicket {
  store: string;
  orderId: number;
  /** Momento em que o pedido chegou (ms). */
  createdAt: number;
  /** Momento em que o pedido foi aceito (ms). */
  acceptedAt: number | null;
  orderType: OrderType;
  customerName: string;
  customerPhone: string;
  items: TicketItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  paymentMethod: PaymentMethod;
  changeFor: string;
  address: string;
  reference: string;
  city: string;
  notes: string;
}

export interface PrintRequest {
  orderId: number;
  /** Segunda via pedida pelo lojista: imprime mesmo que o pedido já tenha saído. */
  reprint: boolean;
  ticket: OrderTicket;
}

export class ValidationError extends Error {}

type Source = Record<string, unknown>;

function isObject(value: unknown): value is Source {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function text(source: Source, field: string, max: number, options: { required?: boolean } = {}): string {
  const value = source[field];
  if (value === undefined || value === null) {
    if (options.required) throw new ValidationError(`Campo obrigatório: ${field}`);
    return '';
  }
  if (typeof value !== 'string') throw new ValidationError(`Campo ${field} deve ser texto`);
  // Tira caracteres de controle de propósito: um ESC (0x1b) no nome do cliente viraria comando ESC/POS.
  // oxlint-disable-next-line no-control-regex
  const clean = value.replace(/[\u0000-\u0009\u000b-\u001f\u007f]/g, '').trim();
  if (options.required && !clean) throw new ValidationError(`Campo obrigatório: ${field}`);
  if (clean.length > max) throw new ValidationError(`Campo ${field} passa de ${max} caracteres`);
  return clean;
}

function amount(source: Source, field: string): number {
  const value = source[field];
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value > 100_000) {
    throw new ValidationError(`Valor inválido em ${field}`);
  }
  return Math.round(value * 100) / 100;
}

/** Datas entre 2020 e 2100, em milissegundos. */
function timestamp(value: unknown, field: string): number {
  if (typeof value !== 'number' || !Number.isInteger(value) || value < 1_577_836_800_000 || value > 4_102_444_800_000) {
    throw new ValidationError(`Data inválida em ${field}`);
  }
  return value;
}

function orderId(value: unknown, field: string): number {
  if (typeof value === 'string' && /^\d{1,12}$/.test(value)) value = Number(value);
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value <= 0) {
    throw new ValidationError(`Número do pedido inválido em ${field}`);
  }
  return value;
}

function item(value: unknown, index: number): TicketItem {
  if (!isObject(value)) throw new ValidationError(`Item ${index + 1} inválido`);
  const quantity = value.quantity;
  if (typeof quantity !== 'number' || !Number.isInteger(quantity) || quantity < 1 || quantity > 99) {
    throw new ValidationError(`Quantidade inválida no item ${index + 1}`);
  }
  const addons = value.addons ?? [];
  if (!Array.isArray(addons) || addons.length > 30) throw new ValidationError(`Adicionais inválidos no item ${index + 1}`);
  return {
    quantity,
    name: text(value, 'name', 80, { required: true }),
    addons: addons.map((addon) => text({ adicional: addon }, 'adicional', 60)).filter(Boolean),
    note: text(value, 'note', 200),
  };
}

export function parseTicket(value: unknown): OrderTicket {
  if (!isObject(value)) throw new ValidationError('Comanda ausente');
  const orderType = value.orderType;
  if (orderType !== 'delivery' && orderType !== 'pickup') throw new ValidationError('Tipo de pedido inválido');
  const paymentMethod = value.paymentMethod;
  if (paymentMethod !== 'pix' && paymentMethod !== 'cash' && paymentMethod !== 'card') {
    throw new ValidationError('Forma de pagamento inválida');
  }
  const items = value.items;
  if (!Array.isArray(items) || items.length < 1 || items.length > 50) {
    throw new ValidationError('A comanda precisa ter de 1 a 50 itens');
  }
  return {
    store: text(value, 'store', 40, { required: true }),
    orderId: orderId(value.orderId, 'ticket.orderId'),
    createdAt: timestamp(value.createdAt, 'createdAt'),
    acceptedAt: value.acceptedAt === undefined || value.acceptedAt === null ? null : timestamp(value.acceptedAt, 'acceptedAt'),
    orderType,
    customerName: text(value, 'customerName', 80, { required: true }),
    customerPhone: text(value, 'customerPhone', 20),
    items: items.map(item),
    subtotal: amount(value, 'subtotal'),
    deliveryFee: amount(value, 'deliveryFee'),
    total: amount(value, 'total'),
    paymentMethod,
    changeFor: text(value, 'changeFor', 20),
    address: text(value, 'address', 200),
    reference: text(value, 'reference', 120),
    city: text(value, 'city', 60),
    notes: text(value, 'notes', 300),
  };
}

export function parsePrintRequest(body: unknown): PrintRequest {
  if (!isObject(body)) throw new ValidationError('Corpo da requisição inválido');
  const id = orderId(body.orderId, 'orderId');
  const ticket = parseTicket(body.ticket);
  if (ticket.orderId !== id) throw new ValidationError('orderId diferente do número na comanda');
  if (body.reprint !== undefined && typeof body.reprint !== 'boolean') throw new ValidationError('reprint deve ser true/false');
  return { orderId: id, reprint: body.reprint === true, ticket };
}
