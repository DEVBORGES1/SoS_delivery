import { checkoutFieldId } from '../../../hooks/useCheckout';
import type { CheckoutSectionProps, PaymentMethod as PaymentMethodValue } from '../../../types/order';
import { TextAreaField, TextField } from '../../ui/Input/TextField';
import { RadioCard } from '../../ui/RadioCard/RadioCard';
import { FormSection } from '../CheckoutForm/FormSection';

const PAYMENT_OPTIONS: { value: PaymentMethodValue; title: string; description: string }[] = [
  { value: 'pix', title: 'Pix', description: 'Chave no WhatsApp' },
  { value: 'cash', title: 'Dinheiro', description: 'Informe o troco' },
  { value: 'card', title: 'Cartão', description: 'Maquininha na entrega' },
];

export function PaymentMethod({ form, setField }: Omit<CheckoutSectionProps, 'errors'>) {
  return (
    <FormSection title="3 · Pagamento">
      <div
        role="radiogroup"
        aria-label="Forma de pagamento"
        className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,150px),1fr))] gap-2.5"
      >
        {PAYMENT_OPTIONS.map((option) => (
          <RadioCard
            key={option.value}
            name="paymentMethod"
            value={option.value}
            checked={form.paymentMethod === option.value}
            onChange={(value) => setField('paymentMethod', value)}
            title={option.title}
            description={option.description}
            className="min-h-16 items-center px-4 py-3.5"
          />
        ))}
      </div>

      {form.paymentMethod === 'cash' && (
        <TextField
          id={checkoutFieldId('changeFor')}
          label="Troco para quanto?"
          optional
          inputMode="decimal"
          placeholder="R$ 100,00"
          value={form.changeFor}
          onChange={(event) => setField('changeFor', event.target.value)}
          className="mt-4 max-w-[280px]"
        />
      )}

      <TextAreaField
        id={checkoutFieldId('notes')}
        label="Observações"
        optional
        resizable
        rows={3}
        placeholder="Ex.: interfone quebrado, chamar no portão"
        value={form.notes}
        onChange={(event) => setField('notes', event.target.value)}
        className="mt-5"
      />
    </FormSection>
  );
}
