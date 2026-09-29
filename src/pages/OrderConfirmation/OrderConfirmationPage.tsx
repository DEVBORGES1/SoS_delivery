import { Check } from 'lucide-react';
import { Navigate, useLocation } from 'react-router';
import { SectionLink } from '../../components/layout/SectionLink';
import { ButtonLink } from '../../components/ui/Button/Button';
import { buttonClasses } from '../../components/ui/Button/buttonStyles';
import { storeConfig } from '../../data/storeConfig';
import type { OrderConfirmation } from '../../types/order';
import { formatCurrency } from '../../utils/currency';
import { ORDER_TYPE_LABELS, PAYMENT_METHOD_LABELS } from '../../utils/order';

function isOrderConfirmation(value: unknown): value is OrderConfirmation {
  return typeof value === 'object' && value !== null && 'id' in value && 'whatsappUrl' in value;
}

export function OrderConfirmationPage() {
  const { state } = useLocation();
  if (!isOrderConfirmation(state)) return <Navigate to="/" replace />;

  const details = [
    { label: 'PEDIDO', value: `#${state.id}`, strong: true },
    { label: 'TOTAL', value: formatCurrency(state.total), strong: true },
    { label: 'RECEBIMENTO', value: ORDER_TYPE_LABELS[state.orderType] },
    { label: 'PAGAMENTO', value: PAYMENT_METHOD_LABELS[state.paymentMethod] },
  ];

  return (
    <section
      aria-labelledby="confirmation-title"
      className="grid min-h-[calc(100vh-72px)] place-items-center px-gutter py-[clamp(32px,6vw,64px)]"
    >
      <title>{`Pedido enviado — ${storeConfig.name}`}</title>
      <div className="flex w-full max-w-[520px] flex-col items-center text-center">
        <div className="grid size-24 place-items-center rounded-full bg-whatsapp shadow-[0_0_0_12px_rgb(23_138_69/0.18),0_0_0_26px_rgb(23_138_69/0.08)]">
          <Check size={44} strokeWidth={3} color="#fff" aria-hidden="true" />
        </div>
        <h1
          id="confirmation-title"
          className="mt-9 font-display text-[clamp(48px,9vw,84px)] leading-[.95] uppercase"
        >
          Pedido enviado!
        </h1>
        <p className="mt-3.5 text-lg text-pretty text-muted">
          Seu pedido foi encaminhado para o WhatsApp da hamburgueria. A gente confirma por lá em instantes.
        </p>

        <dl className="mt-7 grid w-full grid-cols-2 gap-3.5 rounded-[18px] border border-line bg-surface px-5 py-[18px] text-left">
          {details.map((detail) => (
            <div key={detail.label}>
              <dt className="text-xs font-extrabold tracking-[.12em] text-muted">{detail.label}</dt>
              <dd className={detail.strong ? 'text-lg font-extrabold' : 'font-bold'}>{detail.value}</dd>
            </div>
          ))}
        </dl>

        <div className="mt-6 flex w-full flex-col gap-2.5">
          <SectionLink sectionId="cardapio" className={buttonClasses({ size: 'xl', shape: 'rounded', fullWidth: true })}>
            VOLTAR AO CARDÁPIO
          </SectionLink>
          <ButtonLink href={state.whatsappUrl} external variant="outline" size="md" shape="rounded" fullWidth>
            WhatsApp não abriu? Toque aqui
          </ButtonLink>
        </div>
      </div>
    </section>
  );
}
