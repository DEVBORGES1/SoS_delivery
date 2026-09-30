import { useState } from 'react';
import type { DiscountType, Product, Promotion } from '../../types/product';
import { cn } from '../../utils/cn';
import { formatCurrency } from '../../utils/currency';
import {
  calculatePromoPrice,
  defaultPromoBadge,
  isPromotionExpired,
  isPromotionLive,
} from '../../utils/promotions';
import { formatShortDate, isoDatePlusDays, parsePrice, priceToInput } from './adminFormat';
import {
  BTN_OUTLINE,
  BTN_PRIMARY,
  CARD,
  ConfirmButton,
  Drawer,
  Field,
  INPUT,
  LABEL,
  MUTED,
  PrefixedInput,
  Segmented,
  Switch,
  Thumb,
} from './adminUi';
import type { AdminData } from './useAdminData';

interface PromotionDrawerProps {
  /** `null` = nova promoção. */
  promotion: Promotion | null;
  data: AdminData;
  onClose: () => void;
}

export function PromotionDrawer({ promotion, data, onClose }: PromotionDrawerProps) {
  // Itens com preço, mais o item da própria promoção (mesmo que o preço tenha sido zerado depois).
  const pricedProducts = data.products.filter((product) => product.price > 0 || product.id === promotion?.productId);
  const isNew = !promotion;
  const [productId, setProductId] = useState(promotion?.productId ?? pricedProducts[0]?.id ?? '');
  const [discountType, setDiscountType] = useState<DiscountType>(promotion?.discountType ?? 'percent');
  const [value, setValue] = useState(() =>
    promotion ? (promotion.discountType === 'percent' ? String(promotion.value) : priceToInput(promotion.value)) : '10',
  );
  const [validUntil, setValidUntil] = useState(promotion ? (promotion.validUntil ?? '') : isoDatePlusDays(7));
  const [badge, setBadge] = useState(promotion?.badge ?? '');
  const [confirmDelete, setConfirmDelete] = useState(false);

  const product: Product | undefined = data.products.find((item) => item.id === productId);
  const numericValue = parsePrice(value) ?? 0;
  const draft = { discountType, value: numericValue };
  const newPrice = product ? calculatePromoPrice(product.price, draft) : 0;
  const invalid =
    !product || !(numericValue > 0) || !(newPrice > 0 && newPrice < product.price) || (discountType === 'percent' && numericValue >= 100);
  const autoBadge = defaultPromoBadge(draft);

  const changeType = (type: DiscountType) => {
    setDiscountType(type);
    setValue(type === 'percent' ? '10' : priceToInput(product ? Math.round(product.price * 90) / 100 : 0));
  };

  const save = async () => {
    if (invalid || !product) return;
    const saved: Promotion = {
      id: promotion?.id ?? crypto.randomUUID(),
      productId: product.id,
      discountType,
      value: numericValue,
      badge: badge.trim() || autoBadge,
      validUntil: validUntil || undefined,
      active: promotion?.active ?? true,
    };
    if (await data.savePromotion(saved, isNew ? 'Promoção criada e no ar' : 'Promoção atualizada')) onClose();
  };

  const remove = async () => {
    if (!promotion) return;
    if (!confirmDelete) return setConfirmDelete(true);
    if (await data.deletePromotion(promotion)) onClose();
  };

  return (
    <Drawer
      title={isNew ? 'Nova promoção' : 'Editar promoção'}
      width="narrow"
      onClose={onClose}
      footer={
        <>
          {!isNew && (
            <ConfirmButton
              label="Excluir"
              confirmLabel="Confirmar exclusão"
              confirming={confirmDelete}
              disabled={data.saving}
              onClick={() => void remove()}
            />
          )}
          <button type="button" onClick={onClose} className={cn(BTN_OUTLINE, 'ml-auto h-[50px] rounded-xl px-[18px]')}>
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => void save()}
            disabled={invalid || data.saving}
            className={cn(BTN_PRIMARY, 'h-[50px] px-[22px]')}
          >
            {data.saving ? 'SALVANDO…' : 'SALVAR'}
          </button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        {pricedProducts.length === 0 && (
          <p className="m-0 rounded-xl bg-[#fff6dc] px-3.5 py-3 text-sm">
            Defina o preço de algum item no Cardápio antes de criar uma promoção.
          </p>
        )}
        <Field id="p-prod" label="Produto em promoção">
          <select id="p-prod" value={productId} onChange={(event) => setProductId(event.target.value)} className={cn(INPUT, 'px-3')}>
            {pricedProducts.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name} — {formatCurrency(item.price)}
              </option>
            ))}
          </select>
        </Field>
        <div className="flex flex-col gap-1.5">
          <span className={LABEL}>Tipo de desconto</span>
          <Segmented
            ariaLabel="Tipo de desconto"
            value={discountType}
            onChange={changeType}
            options={[
              { id: 'percent', label: '% de desconto' },
              { id: 'price', label: 'Preço final' },
            ]}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field id="p-val" label={discountType === 'percent' ? 'Desconto' : 'Preço promocional'}>
            <PrefixedInput
              id="p-val"
              prefix={discountType === 'percent' ? undefined : 'R$'}
              suffix={discountType === 'percent' ? '%' : undefined}
              inputMode="decimal"
              value={value}
              onChange={(event) => setValue(event.target.value)}
            />
          </Field>
          <Field id="p-until" label="Válida até" hint="Deixe vazio para não expirar.">
            <input
              id="p-until"
              type="date"
              value={validUntil}
              onChange={(event) => setValidUntil(event.target.value)}
              className={cn(INPUT, 'px-3')}
            />
          </Field>
        </div>
        <Field id="p-badge" label="Selo no site">
          <input
            id="p-badge"
            value={badge}
            maxLength={18}
            placeholder={autoBadge}
            onChange={(event) => setBadge(event.target.value)}
            className={INPUT}
          />
        </Field>
        {product && (
          <div className="flex items-center gap-3.5 rounded-[14px] bg-[#faf7f2] px-[18px] py-4">
            <Thumb src={product.image} className="size-16" />
            <div className="min-w-0 flex-1">
              <span className="rounded-[5px] bg-[#f2b53a] px-[7px] py-0.5 text-[11px] font-extrabold text-[#1a1109] uppercase">
                {badge.trim() || autoBadge}
              </span>
              <div className="mt-1 text-base font-extrabold">{product.name}</div>
              <div className="flex flex-wrap items-baseline gap-2">
                <span className={cn('text-[13px] line-through', MUTED)}>{formatCurrency(product.price)}</span>
                <span className="text-xl font-extrabold text-[#d3301f]">{formatCurrency(newPrice)}</span>
                {newPrice < product.price && newPrice > 0 && (
                  <span className="text-[13px] font-bold text-[#178a45]">
                    economia de {formatCurrency(product.price - newPrice)}
                  </span>
                )}
              </div>
            </div>
          </div>
        )}
        {invalid && product && (
          <span role="alert" className="text-[13px] font-semibold text-[#b3261e]">
            O preço promocional precisa ser menor que o preço normal.
          </span>
        )}
      </div>
    </Drawer>
  );
}

interface PromotionsTabProps {
  data: AdminData;
  onNew: () => void;
  onEdit: (promotion: Promotion) => void;
}

export function PromotionsTab({ data, onNew, onEdit }: PromotionsTabProps) {
  const { promotions, products, saving, savePromotion } = data;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className={cn('m-0 max-w-[520px]', MUTED)}>
          Promoções ativas aparecem no site com o preço antigo riscado e o selo que você escolher.
        </p>
        <button type="button" onClick={onNew} className={BTN_PRIMARY}>
          + NOVA PROMOÇÃO
        </button>
      </div>

      {promotions.length === 0 ? (
        <div className="rounded-[18px] border-[1.5px] border-dashed border-[#d8cdbd] bg-white px-5 py-12 text-center">
          <div className="font-display text-[28px] uppercase">Nenhuma promoção ainda</div>
          <p className={cn('mt-1.5 mb-[18px]', MUTED)}>Que tal um lanche em oferta pra movimentar a quarta?</p>
          <button type="button" onClick={onNew} className={BTN_PRIMARY}>
            CRIAR PROMOÇÃO
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,320px),1fr))] gap-3.5">
          {promotions.map((promotion) => {
            const product = products.find((item) => item.id === promotion.productId);
            const expired = isPromotionExpired(promotion);
            const live = isPromotionLive(promotion);
            const price = product?.price ?? 0;
            return (
              <article
                key={promotion.id}
                className={cn(CARD, 'flex flex-col overflow-hidden', !live && 'opacity-70')}
              >
                <div className="relative h-[140px]">
                  <Thumb src={product?.image} className="size-full rounded-none" />
                  <span className="absolute top-3 left-3 rounded-md bg-[#f2b53a] px-[9px] py-1 text-xs font-extrabold text-[#1a1109] uppercase">
                    {promotion.badge || defaultPromoBadge(promotion)}
                  </span>
                  <span
                    className={cn(
                      'absolute top-3 right-3 rounded-full px-[9px] py-1 text-[11px] font-extrabold tracking-[.04em] text-white',
                      live ? 'bg-[#178a45]' : 'bg-[#6a5c4d]',
                    )}
                  >
                    {live ? 'NO AR' : expired ? 'ENCERRADA' : 'PAUSADA'}
                  </span>
                </div>
                <div className="flex flex-1 flex-col gap-1.5 px-[18px] pt-4 pb-[18px]">
                  <h3 className="m-0 font-display text-2xl leading-[1.1] font-normal uppercase">
                    {product?.name ?? '(produto removido)'}
                  </h3>
                  <div className="flex items-baseline gap-2.5">
                    <span className={cn('text-sm line-through', MUTED)}>{formatCurrency(price)}</span>
                    <span className="text-[22px] font-extrabold text-[#d3301f]">
                      {formatCurrency(calculatePromoPrice(price, promotion))}
                    </span>
                  </div>
                  <div className={cn('text-[13px]', MUTED)}>
                    {promotion.validUntil
                      ? expired
                        ? `Encerrou em ${formatShortDate(promotion.validUntil)}`
                        : `Válida até ${formatShortDate(promotion.validUntil)}`
                      : 'Sem data de término'}
                  </div>
                  <div className="mt-auto flex items-center justify-between gap-2.5 pt-3">
                    <span className="flex items-center gap-2.5 text-sm font-bold">
                      <Switch
                        label="Ativar promoção"
                        checked={promotion.active}
                        disabled={saving}
                        onChange={(active) =>
                          void savePromotion({ ...promotion, active }, active ? 'Promoção no ar' : 'Promoção pausada')
                        }
                      />
                      {promotion.active ? 'Ativa' : 'Pausada'}
                    </span>
                    <button type="button" onClick={() => onEdit(promotion)} className={BTN_OUTLINE}>
                      Editar
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
