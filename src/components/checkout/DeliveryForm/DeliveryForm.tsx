import { storeConfig } from '../../../data/storeConfig';
import { checkoutFieldId } from '../../../hooks/useCheckout';
import { useDeliveryConfig } from '../../../hooks/useDeliveryConfig';
import { useStoreSettings } from '../../../hooks/useStoreSettings';
import type { CheckoutSectionProps, OrderType } from '../../../types/order';
import { cn } from '../../../utils/cn';
import { formatCurrency } from '../../../utils/currency';
import { findZone, quoteDelivery, type DeliveryConfig, type DeliveryQuote } from '../../../utils/delivery';
import { SelectField, TextField } from '../../ui/Input/TextField';
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
  { field: 'reference', label: 'Ponto de referência', placeholder: 'Ex.: perto do mercado, casa azul' },
];

function feeText(fee: number): string {
  return fee ? formatCurrency(fee) : 'grátis';
}

/** Taxa no card "Entrega": a da promoção, "por bairro" ou a taxa única. */
function deliveryFeeHint({ zones, fallbackFee, freeDelivery }: DeliveryConfig): string {
  if (freeDelivery) return 'entrega grátis';
  if (zones.length) return 'taxa por bairro';
  return feeText(fallbackFee);
}

function FreeDeliveryBanner() {
  return (
    <div className="mt-4 flex items-center gap-3 rounded-control border-[1.5px] border-whatsapp bg-whatsapp/10 px-4 py-3">
      <span aria-hidden="true" className="text-xl">
        🎉
      </span>
      <p className="text-[15px] leading-snug">
        <b className="text-success-ink">Promoção: entrega grátis</b> para todos os bairros atendidos.
      </p>
    </div>
  );
}

/** Taxa do bairro escolhido, riscada quando a entrega grátis está valendo. */
function DistrictFee({ quote }: { quote: DeliveryQuote }) {
  if (quote.originalFee === null) return null;
  const savings = quote.freeDelivery ? quote.originalFee : 0;
  return (
    <dl aria-live="polite" className="mt-4 flex flex-col gap-1 rounded-control bg-surface-alt p-4 text-[15px]">
      {quote.district && (
        <div className="flex justify-between gap-3">
          <dt className="text-muted">Bairro</dt>
          <dd className="font-bold">{quote.district}</dd>
        </div>
      )}
      <div className="flex justify-between gap-3">
        <dt className="text-muted">Taxa de entrega</dt>
        <dd className="font-bold">
          {quote.freeDelivery ? (
            <>
              {savings > 0 && <s className="mr-2 font-medium text-muted">{formatCurrency(savings)}</s>}
              <span className="font-extrabold text-success-ink">GRÁTIS</span>
            </>
          ) : (
            feeText(quote.fee)
          )}
        </dd>
      </div>
      {savings > 0 && (
        <div className="flex justify-between gap-3">
          <dt className="text-muted">Economia na entrega</dt>
          <dd className="font-extrabold text-success-ink">{formatCurrency(savings)}</dd>
        </div>
      )}
    </dl>
  );
}

export function DeliveryForm({ form, errors, setField }: CheckoutSectionProps) {
  const { deliveryEnabled, pickupEnabled, deliveryEta, pickupEta } = useStoreSettings();
  const delivery = useDeliveryConfig();
  const { zones, freeDelivery } = delivery;
  const quote = quoteDelivery(form.orderType, form.district, delivery);

  const orderTypeOptions: OrderTypeOption[] = [
    {
      value: 'delivery',
      title: 'Entrega',
      description: `${deliveryEta} · ${deliveryFeeHint(delivery)}`,
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
        <>
          {freeDelivery && <FreeDeliveryBanner />}
          <div className={cn(FIELD_GRID, 'mt-[18px]')}>
            {ADDRESS_FIELDS.map((config) =>
              config.field === 'district' && zones.length ? (
                <SelectField
                  key={config.field}
                  id={checkoutFieldId('district')}
                  label={config.label}
                  value={findZone(zones, form.district)?.name ?? ''}
                  error={errors.district}
                  onChange={(event) => setField('district', event.target.value)}
                >
                  <option value="" disabled>
                    Escolha o bairro
                  </option>
                  {zones.map((zone) => (
                    <option key={zone.id} value={zone.name}>
                      {zone.name} — {freeDelivery ? 'grátis' : feeText(zone.fee)}
                    </option>
                  ))}
                </SelectField>
              ) : (
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
              ),
            )}
          </div>
          {(zones.length > 0 || freeDelivery) && <DistrictFee quote={quote} />}
        </>
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
