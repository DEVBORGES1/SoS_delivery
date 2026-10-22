export type OrderType = 'delivery' | 'pickup';

export type PaymentMethod = 'pix' | 'cash' | 'card';

export interface CheckoutFormData {
  name: string;
  phone: string;
  orderType: OrderType;
  street: string;
  number: string;
  district: string;
  complement: string;
  reference: string;
  paymentMethod: PaymentMethod;
  changeFor: string;
  notes: string;
}

export type CheckoutField = keyof CheckoutFormData;

export type CheckoutErrors = Partial<Record<CheckoutField, string>>;

type SetCheckoutField = <K extends CheckoutField>(field: K, value: CheckoutFormData[K]) => void;

/** Props comuns aos blocos do formulário de checkout. */
export interface CheckoutSectionProps {
  form: CheckoutFormData;
  errors: CheckoutErrors;
  setField: SetCheckoutField;
}

export interface OrderTotals {
  subtotal: number;
  /** Taxa de entrega cobrada (0 na retirada e durante a entrega grátis). */
  deliveryFee: number;
  /** Taxa cadastrada para o bairro (ou a taxa única); `null` na retirada ou sem bairro escolhido. */
  deliveryFeeOriginal: number | null;
  /** Promoção de entrega grátis aplicada ao pedido. */
  freeDelivery: boolean;
  total: number;
}

export interface OrderLine {
  emoji: string;
  name: string;
  quantity: number;
  addons: string[];
  note: string;
  lineTotal: number;
}

export interface Order extends OrderTotals {
  id: string;
  items: OrderLine[];
  customer: CheckoutFormData;
}

/** Dados exibidos na tela de confirmação. */
export interface OrderConfirmation {
  id: string;
  total: number;
  orderType: OrderType;
  paymentMethod: PaymentMethod;
  whatsappUrl: string;
}

/** Etapas de um pedido no painel. */
export type OrderStatus = 'novo' | 'aceito' | 'preparando' | 'saiu' | 'pronto' | 'concluido' | 'cancelado';

/** Item como fica gravado no banco (tabela `orders`, coluna `items`). */
export interface SavedOrderLine {
  name: string;
  quantity: number;
  addons: string[];
  note: string;
  lineTotal: number;
}

export interface OrderHistoryEntry {
  s: OrderStatus;
  /** Momento da mudança, em milissegundos. */
  at: number;
}

/**
 * Situação da comanda impressa (colunas `print_*` da tabela `orders`):
 * `none` nunca impressa · `printing` enviando · `printed` saiu · `failed` não saiu.
 */
export type PrintStatus = 'none' | 'printing' | 'printed' | 'failed';

/** Pedido como o painel `/admin` enxerga. */
export interface AdminOrder {
  id: number;
  createdAt: number;
  status: OrderStatus;
  customerName: string;
  customerPhone: string;
  orderType: OrderType;
  address: string;
  reference: string;
  paymentMethod: PaymentMethod;
  changeFor: string;
  notes: string;
  items: SavedOrderLine[];
  subtotal: number;
  /** Taxa cobrada no pedido. */
  deliveryFee: number;
  /** Bairro da entrega, como estava cadastrado ('' na retirada e em pedidos antigos). */
  deliveryDistrict: string;
  /** Taxa cadastrada no momento do pedido; `null` na retirada e em pedidos antigos. */
  deliveryFeeOriginal: number | null;
  /** A promoção de entrega grátis valeu para este pedido. */
  freeDelivery: boolean;
  total: number;
  history: OrderHistoryEntry[];
  printStatus: PrintStatus;
  /** Motivo da última falha de impressão. */
  printError: string;
  printAttempts: number;
  /** Última mudança na impressão (ms). */
  printUpdatedAt: number | null;
  printedAt: number | null;
}
