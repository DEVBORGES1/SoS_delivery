import type { CheckoutErrors, CheckoutFormData } from '../types/order';
import type { DeliveryZone } from '../types/store';
import { findZone } from './delivery';
import { onlyDigits } from './formatters';

const MIN_PHONE_DIGITS = 10;

/** `zones` = bairros ativos; com eles, o bairro precisa ser um dos atendidos. */
export function validateCheckout(form: CheckoutFormData, zones: DeliveryZone[] = []): CheckoutErrors {
  const errors: CheckoutErrors = {};

  if (!form.name.trim()) errors.name = 'Informe seu nome';
  if (onlyDigits(form.phone).length < MIN_PHONE_DIGITS) {
    errors.phone = 'Telefone com DDD, ex.: (49) 99999-9999';
  }

  if (form.orderType === 'delivery') {
    if (!form.street.trim()) errors.street = 'Informe a rua';
    if (!form.number.trim()) errors.number = 'Informe o número';
    if (zones.length) {
      if (!findZone(zones, form.district)) errors.district = 'Escolha o bairro da entrega';
    } else if (!form.district.trim()) {
      errors.district = 'Informe o bairro';
    }
    if (!form.reference.trim()) errors.reference = 'Informe um ponto de referência';
  }

  return errors;
}
