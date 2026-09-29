import { checkoutFieldId } from '../../../hooks/useCheckout';
import type { CheckoutSectionProps } from '../../../types/order';
import { maskPhone } from '../../../utils/formatters';
import { TextField } from '../../ui/Input/TextField';
import { FIELD_GRID, FormSection } from '../CheckoutForm/FormSection';

export function CustomerForm({ form, errors, setField }: CheckoutSectionProps) {
  return (
    <FormSection title="1 · Seus dados">
      <div className={FIELD_GRID}>
        <TextField
          id={checkoutFieldId('name')}
          label="Nome"
          autoComplete="name"
          placeholder="Como devemos te chamar?"
          value={form.name}
          error={errors.name}
          onChange={(event) => setField('name', event.target.value)}
        />
        <TextField
          id={checkoutFieldId('phone')}
          label="Telefone / WhatsApp"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder="(49) 99999-9999"
          value={form.phone}
          error={errors.phone}
          onChange={(event) => setField('phone', maskPhone(event.target.value))}
        />
      </div>
    </FormSection>
  );
}
