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
  deliveryFee: number;
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
