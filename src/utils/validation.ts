import type { CheckoutErrors, CheckoutFormData } from '../types/order';
import { onlyDigits } from './formatters';

const MIN_PHONE_DIGITS = 10;

export function validateCheckout(form: CheckoutFormData): CheckoutErrors {
  const errors: CheckoutErrors = {};

  if (!form.name.trim()) errors.name = 'Informe seu nome';
  if (onlyDigits(form.phone).length < MIN_PHONE_DIGITS) {
    errors.phone = 'Telefone com DDD, ex.: (49) 99999-9999';
  }

  if (form.orderType === 'delivery') {
    if (!form.street.trim()) errors.street = 'Informe a rua';
    if (!form.number.trim()) errors.number = 'Informe o número';
    if (!form.district.trim()) errors.district = 'Informe o bairro';
  }

  return errors;
}
