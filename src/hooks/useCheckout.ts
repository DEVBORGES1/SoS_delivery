import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router';
import { ROUTES } from '../routes';
import { getOrderUrl, openWhatsApp } from '../services/whatsappService';
import type { CheckoutErrors, CheckoutField, CheckoutFormData, OrderConfirmation } from '../types/order';
import { createOrder } from '../utils/order';
import { calculateOrderTotals } from '../utils/pricing';
import { validateCheckout } from '../utils/validation';
import { useCart } from './useCart';
import { useCatalog } from './useCatalog';
import { useStoreSettings } from './useStoreSettings';
import { useStoreStatus } from './useStoreStatus';

const INITIAL_FORM: CheckoutFormData = {
  name: '',
  phone: '',
  orderType: 'delivery',
  street: '',
  number: '',
  district: '',
  complement: '',
  reference: '',
  paymentMethod: 'pix',
  changeFor: '',
  notes: '',
};

export function checkoutFieldId(field: CheckoutField): string {
  return `checkout-${field}`;
}

function focusField(field: CheckoutField) {
  const element = document.getElementById(checkoutFieldId(field));
  if (!element) return;
  element.scrollIntoView({ behavior: 'smooth', block: 'center' });
  element.focus({ preventScroll: true });
}

function getSubmitLabel(isOpen: boolean, isEmpty: boolean, hasSendError: boolean, nextOpening: string) {
  if (!isOpen) return `LOJA FECHADA · ABRE ${nextOpening}`.toUpperCase();
  if (isEmpty) return 'CARRINHO VAZIO';
  if (hasSendError) return 'TENTAR NOVAMENTE';
  return 'ENVIAR PEDIDO PELO WHATSAPP';
}

/** Estado do formulário de checkout, validação e envio do pedido ao WhatsApp. */
export function useCheckout() {
  const navigate = useNavigate();
  const { categories } = useCatalog();
  const { items, clearCart } = useCart();
  const { isOpen, nextOpenDay, nextOpenTime } = useStoreStatus();
  const { deliveryEnabled, pickupEnabled, deliveryFee } = useStoreSettings();

  const [form, setForm] = useState(INITIAL_FORM);

  // Se a loja desativar entrega (ou retirada) no painel, troca para a opção disponível.
  const orderType =
    form.orderType === 'delivery' && !deliveryEnabled && pickupEnabled
      ? 'pickup'
      : form.orderType === 'pickup' && !pickupEnabled && deliveryEnabled
        ? 'delivery'
        : form.orderType;
  const currentForm = orderType === form.orderType ? form : { ...form, orderType };
  const [errors, setErrors] = useState<CheckoutErrors>({});
  const [hasSendError, setHasSendError] = useState(false);

  const setField = useCallback(<K extends CheckoutField>(field: K, value: CheckoutFormData[K]) => {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    setHasSendError(false);
  }, []);

  const totals = calculateOrderTotals(items, orderType, deliveryFee);
  const isEmpty = items.length === 0;

  const submit = () => {
    const validationErrors = validateCheckout(currentForm);
    const firstInvalid = Object.keys(validationErrors)[0] as CheckoutField | undefined;
    setErrors(validationErrors);
    if (firstInvalid) {
      focusField(firstInvalid);
      return;
    }

    const order = createOrder(currentForm, items, categories, deliveryFee);
    const whatsappUrl = getOrderUrl(order);
    if (!openWhatsApp(whatsappUrl)) {
      setHasSendError(true);
      return;
    }

    const confirmation: OrderConfirmation = {
      id: order.id,
      total: order.total,
      orderType,
      paymentMethod: form.paymentMethod,
      whatsappUrl,
    };
    clearCart();
    navigate(ROUTES.confirmation, { state: confirmation, replace: true });
  };

  return {
    form: currentForm,
    errors,
    setField,
    items,
    totals,
    hasSendError,
    submit,
    submitDisabled: !isOpen || isEmpty,
    submitLabel: getSubmitLabel(isOpen, isEmpty, hasSendError, `${nextOpenDay} ${nextOpenTime}`),
  };
}
