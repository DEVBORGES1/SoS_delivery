import { CheckoutForm } from '../../components/checkout/CheckoutForm/CheckoutForm';
import { OrderSummary } from '../../components/checkout/OrderSummary/OrderSummary';
import { OrderSummaryAccordion } from '../../components/checkout/OrderSummary/OrderSummaryAccordion';
import { SendErrorAlert, SubmitOrderButton } from '../../components/checkout/SubmitOrder/SubmitOrder';
import { SectionLink } from '../../components/layout/SectionLink';
import { storeConfig } from '../../data/storeConfig';
import { useCheckout } from '../../hooks/useCheckout';
import { formatCurrency } from '../../utils/currency';

export function CheckoutPage() {
  const checkout = useCheckout();
  const summary = { items: checkout.items, totals: checkout.totals, orderType: checkout.form.orderType };
  const submit = (
    <SubmitOrderButton label={checkout.submitLabel} disabled={checkout.submitDisabled} onSubmit={checkout.submit} />
  );

  return (
    <section aria-labelledby="checkout-title" className="px-gutter pt-[clamp(24px,4vw,48px)] pb-[clamp(64px,8vw,96px)]">
      <title>{`Finalizar pedido — ${storeConfig.name}`}</title>
      <div className="mx-auto max-w-[1160px]">
        <SectionLink
          sectionId="cardapio"
          className="inline-flex items-center gap-2 py-2.5 text-sm font-bold text-muted hover:text-ink"
        >
          ← Voltar ao cardápio
        </SectionLink>
        <h1 id="checkout-title" className="mt-2 font-display text-[clamp(40px,6vw,76px)] leading-[.95] uppercase">
          Finalize seu pedido
        </h1>
        <p className="mt-2.5 text-base text-muted">Preencha rapidinho — o pedido chega pronto no nosso WhatsApp.</p>

        <div className="mt-7 grid grid-cols-1 items-start gap-[clamp(20px,3vw,40px)] lg:grid-cols-[minmax(0,1fr)_400px]">
          <div className="flex min-w-0 flex-col gap-4">
            <OrderSummaryAccordion {...summary} />
            <CheckoutForm form={checkout.form} errors={checkout.errors} setField={checkout.setField} />
            {checkout.hasSendError && <SendErrorAlert />}

            <div className="mt-1 flex flex-col gap-2.5 lg:hidden">
              <div className="flex items-baseline justify-between px-1">
                <span className="font-bold">Total</span>
                <span className="text-2xl font-extrabold">{formatCurrency(checkout.totals.total)}</span>
              </div>
              {submit}
            </div>
          </div>

          <aside
            aria-label="Resumo do pedido"
            className="sticky top-24 flex flex-col gap-3.5 rounded-card border border-line bg-surface p-[26px] max-lg:hidden"
          >
            <OrderSummary {...summary} />
            {submit}
          </aside>
        </div>
      </div>
    </section>
  );
}
