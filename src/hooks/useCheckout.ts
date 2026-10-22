import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router';
import { ROUTES } from '../routes';
import { saveOrder, type SavedOrder } from '../services/orderService';
import { refreshDeliveryConfig } from '../services/productService';
import { getOrderUrl, reserveWhatsAppTab } from '../services/whatsappService';
import type { CheckoutErrors, CheckoutField, CheckoutFormData, Order, OrderConfirmation } from '../types/order';
import { findZone, quoteDelivery } from '../utils/delivery';
import { createOrder } from '../utils/order';
import { calculateOrderTotals } from '../utils/pricing';
import { clearSavedCustomer, loadSavedCustomer, saveCustomer } from '../utils/savedCustomer';
import { validateCheckout } from '../utils/validation';
import { useCart } from './useCart';
import { useCatalog } from './useCatalog';
import { getDeliveryConfig, useDeliveryConfig, useDeliveryConfigRefresh } from './useDeliveryConfig';
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

/** O banco é quem decide a taxa: usa o número oficial e os valores que ele gravou. */
function withSavedValues(draft: Order, saved: SavedOrder): Order {
  return {
    ...draft,
    ...saved.totals,
    id: String(saved.id),
    customer: saved.district ? { ...draft.customer, district: saved.district } : draft.customer,
  };
}

function getSubmitLabel(isOpen: boolean, isEmpty: boolean, hasSendError: boolean, isSending: boolean, nextOpening: string) {
  if (isSending) return 'ENVIANDO PEDIDO…';
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
  const { deliveryEnabled, pickupEnabled } = useStoreSettings();
  const delivery = useDeliveryConfig();
  useDeliveryConfigRefresh();

  // Cliente que já pediu neste aparelho começa com os dados do último pedido.
  const [savedCustomer] = useState(loadSavedCustomer);
  const [form, setForm] = useState<CheckoutFormData>(() => ({ ...INITIAL_FORM, ...savedCustomer }));
  const [returningName, setReturningName] = useState(savedCustomer?.name.trim().split(/\s+/)[0] ?? null);

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
  /** A taxa de entrega mudou entre abrir o checkout e enviar. */
  const [feeChanged, setFeeChanged] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const setField = useCallback(<K extends CheckoutField>(field: K, value: CheckoutFormData[K]) => {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    setHasSendError(false);
    setFeeChanged(false);
  }, []);

  /** "Não é você?": apaga os dados lembrados e esvazia o formulário. */
  const forgetCustomer = useCallback(() => {
    clearSavedCustomer();
    setForm(INITIAL_FORM);
    setErrors({});
    setReturningName(null);
    focusField('name');
  }, []);

  const quote = quoteDelivery(orderType, currentForm.district, delivery);
  const totals = calculateOrderTotals(items, quote);
  const isEmpty = items.length === 0;

  /** Bairro recusado (saiu da lista depois que a página abriu): pede para escolher de novo. */
  const rejectDistrict = (message: string) => {
    setErrors({ district: message });
    focusField('district');
  };

  const submit = async () => {
    if (isSending) return;
    const validationErrors = validateCheckout(currentForm, delivery.zones);
    const firstInvalid = Object.keys(validationErrors)[0] as CheckoutField | undefined;
    setErrors(validationErrors);
    if (firstInvalid) {
      focusField(firstInvalid);
      return;
    }

    // A aba do WhatsApp é aberta já no clique; o navegador bloquearia se abrisse depois da espera.
    const tab = reserveWhatsAppTab();
    if (!tab) {
      setHasSendError(true);
      return;
    }
    const giveUp = () => {
      tab.close();
      setIsSending(false);
    };

    setIsSending(true);
    setFeeChanged(false);
    // Confere a taxa com o banco: a promoção ou a taxa do bairro podem ter mudado com a página aberta.
    await refreshDeliveryConfig();
    const latest = getDeliveryConfig();
    if (orderType === 'delivery' && latest.zones.length && !findZone(latest.zones, currentForm.district)) {
      giveUp();
      return rejectDistrict('Não entregamos mais neste bairro. Escolha outro da lista.');
    }
    const latestQuote = quoteDelivery(orderType, currentForm.district, latest);
    if (latestQuote.fee !== totals.deliveryFee) {
      giveUp();
      setFeeChanged(true);
      return;
    }

    saveCustomer(currentForm);
    const draft = createOrder(currentForm, items, categories, latestQuote);
    // Salva no painel para usar o número oficial; se o banco falhar, segue com o número provisório.
    const result = await saveOrder(draft);
    if (result.status === 'invalid-district') {
      giveUp();
      void refreshDeliveryConfig();
      return rejectDistrict(result.message);
    }
    const order = result.status === 'saved' ? withSavedValues(draft, result.order) : draft;
    const whatsappUrl = getOrderUrl(order);
    tab.open(whatsappUrl);
    setIsSending(false);

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
    feeChanged,
    submit,
    returningName,
    forgetCustomer,
    submitDisabled: !isOpen || isEmpty || isSending,
    submitLabel: getSubmitLabel(isOpen, isEmpty, hasSendError, isSending, `${nextOpenDay} ${nextOpenTime}`),
  };
}
