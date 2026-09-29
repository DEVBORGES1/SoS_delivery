import { storeConfig } from '../../../data/storeConfig';
import { checkoutFieldId } from '../../../hooks/useCheckout';
import { useStoreSettings } from '../../../hooks/useStoreSettings';
import type { CheckoutSectionProps, OrderType } from '../../../types/order';
import { cn } from '../../../utils/cn';
import { formatCurrency } from '../../../utils/currency';
import { TextField } from '../../ui/Input/TextField';
import { RadioCard } from '../../ui/RadioCard/RadioCard';
import { FIELD_GRID, FormSection } from '../CheckoutForm/FormSection';

interface OrderTypeOption {
  value: OrderType;
  title: string;
  description: string;
  enabled: boolean;
}

type AddressField = 'street' | 'number' | 'district' | 'complement' | 'reference';

const ADDRESS_FIELDS: {
  field: AddressField;
  label: string;
  placeholder: string;
  optional?: boolean;
  autoComplete?: string;
  fullWidth?: boolean;
}[] = [
  { field: 'street', label: 'Endereço', placeholder: 'Rua / avenida', autoComplete: 'address-line1', fullWidth: true },
  { field: 'number', label: 'Número', placeholder: '123' },
  { field: 'district', label: 'Bairro', placeholder: 'Centro' },
  { field: 'complement', label: 'Complemento', placeholder: 'Apto, bloco…', optional: true, autoComplete: 'address-line2' },
  { field: 'reference', label: 'Referência', placeholder: 'Perto de…', optional: true },
];

export function DeliveryForm({ form, errors, setField }: CheckoutSectionProps) {
  const { deliveryEnabled, pickupEnabled, deliveryFee, deliveryEta, pickupEta } = useStoreSettings();

  const orderTypeOptions: OrderTypeOption[] = [
    {
      value: 'delivery',
      title: 'Entrega',
      description: `${deliveryEta} · ${deliveryFee ? formatCurrency(deliveryFee) : 'grátis'}`,
      enabled: deliveryEnabled,
    },
    { value: 'pickup', title: 'Retirada', description: `${pickupEta} · grátis`, enabled: pickupEnabled },
  ];

  return (
    <FormSection title="2 · Como quer receber?">
      <div role="radiogroup" aria-label="Tipo do pedido" className="grid grid-cols-2 gap-2.5">
        {orderTypeOptions.filter((option) => option.enabled).map((option) => (
          <RadioCard
            key={option.value}
            name="orderType"
            value={option.value}
            checked={form.orderType === option.value}
            onChange={(value) => setField('orderType', value)}
            title={option.title}
            description={option.description}
            className="min-h-[76px] items-start p-4"
          />
        ))}
      </div>

      {form.orderType === 'delivery' ? (
        <div className={cn(FIELD_GRID, 'mt-[18px]')}>
          {ADDRESS_FIELDS.map((config) => (
            <TextField
              key={config.field}
              id={checkoutFieldId(config.field)}
              label={config.label}
              optional={config.optional}
              placeholder={config.placeholder}
              autoComplete={config.autoComplete}
              value={form[config.field]}
              error={errors[config.field]}
              onChange={(event) => setField(config.field, event.target.value)}
              className={config.fullWidth ? 'md:col-span-2' : undefined}
            />
          ))}
        </div>
      ) : (
        <div className="mt-4 rounded-control bg-surface-alt p-4 text-[15px] leading-normal">
          <b>Retire em:</b> {storeConfig.address} — {storeConfig.district}, {storeConfig.city}/{storeConfig.state}.
          <br />
          <span className="text-muted">Avisamos no WhatsApp quando estiver pronto ({pickupEta}).</span>
        </div>
      )}
    </FormSection>
  );
}
