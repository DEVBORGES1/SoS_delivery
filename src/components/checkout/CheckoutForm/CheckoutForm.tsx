import type { CheckoutSectionProps } from '../../../types/order';
import { CustomerForm } from '../CustomerForm/CustomerForm';
import { DeliveryForm } from '../DeliveryForm/DeliveryForm';
import { PaymentMethod } from '../PaymentMethod/PaymentMethod';

export function CheckoutForm({ form, errors, setField }: CheckoutSectionProps) {
  return (
    <>
      <CustomerForm form={form} errors={errors} setField={setField} />
      <DeliveryForm form={form} errors={errors} setField={setField} />
      <PaymentMethod form={form} setField={setField} />
    </>
  );
}
