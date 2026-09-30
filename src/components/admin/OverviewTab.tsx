import { useState } from 'react';
import type { StoreStatusOverride } from '../../types/store';
import { cn } from '../../utils/cn';
import { isPromotionLive } from '../../utils/promotions';
import type { AdminTab } from './adminTabs';
import { useStoreStatusText } from './useStoreStatusText';
import { BTN_PRIMARY, CARD, CARD_PAD, INPUT, MUTED, Segmented, Switch } from './adminUi';
import type { AdminData } from './useAdminData';

const STATUS_OPTIONS: { id: StoreStatusOverride; label: string; toast: string }[] = [
  { id: 'auto', label: 'Automático', toast: 'Loja no modo automático' },
  { id: 'open', label: 'Abrir agora', toast: 'Loja aberta' },
  { id: 'closed', label: 'Fechar agora', toast: 'Loja fechada' },
];

interface OverviewTabProps {
  data: AdminData;
  onGo: (tab: AdminTab, options?: { orderFilter?: 'novos' }) => void;
  onNewProduct: () => void;
  onNewPromotion: () => void;
}

export function OverviewTab({ data, onGo, onNewProduct, onNewPromotion }: OverviewTabProps) {
  const { settings, products, promotions, orders, saveSettings } = data;
  const status = useStoreStatusText(settings.statusOverride);
  const [bannerDraft, setBannerDraft] = useState<string | null>(null);
  const bannerText = bannerDraft ?? settings.bannerText;

  const newOrders = orders.filter((order) => order.status === 'novo').length;
  const soldOut = products.filter((product) => !product.available).length;
  const livePromos = promotions.filter((promotion) => isPromotionLive(promotion)).length;

  const stats = [
    { n: newOrders, label: 'Pedidos novos', sub: 'Abrir pedidos', color: newOrders ? 'var(--adm-accent)' : 'var(--adm-ink)', go: () => onGo('orders', { orderFilter: 'novos' }) },
    { n: products.length - soldOut, label: 'Itens no cardápio', sub: 'Gerenciar cardápio', color: 'var(--adm-ink)', go: () => onGo('menu') },
    { n: soldOut, label: 'Esgotados hoje', sub: soldOut ? 'Ver quais' : 'Nada esgotado', color: soldOut ? 'var(--adm-accent)' : 'var(--adm-ink)', go: () => onGo('menu') },
    { n: livePromos, label: 'Promoções no ar', sub: 'Ver promoções', color: 'var(--adm-green-text)', go: () => onGo('promos') },
  ];

  const commitBanner = () => {
    if (bannerDraft === null || bannerDraft === settings.bannerText) return setBannerDraft(null);
    void saveSettings({ bannerText: bannerDraft.trim() }, 'Texto do aviso salvo').then(() => setBannerDraft(null));
  };

  return (
    <div className="flex flex-col gap-4">
      <section
        aria-labelledby="status-title"
        className={cn(CARD, CARD_PAD, 'flex flex-wrap items-center justify-between gap-5')}
      >
        <div>
          <h2 id="status-title" className="m-0 text-[13px] font-extrabold tracking-[.14em] text-(--adm-muted)">
            STATUS DA LOJA
          </h2>
          <div className="mt-2 flex items-center gap-3">
            <span
              className={cn(
                'size-3.5 rounded-full',
                status.isOpen
                  ? 'bg-[#34c759] shadow-[0_0_0_6px_rgba(52,199,89,.18)]'
                  : 'bg-[#ff5a4a] shadow-[0_0_0_6px_rgba(255,90,74,.18)]',
              )}
            />
            <span className="font-display text-[clamp(28px,4vw,40px)] leading-[1.1] uppercase">{status.title}</span>
          </div>
          <p className={cn('mt-1.5 mb-0 text-sm', MUTED)}>{status.subtitle}</p>
        </div>
        <Segmented
          ariaLabel="Controle de abertura"
          value={settings.statusOverride}
          onChange={(id) => {
            const option = STATUS_OPTIONS.find((item) => item.id === id);
            void saveSettings({ statusOverride: id }, option?.toast ?? 'Status salvo');
          }}
          options={STATUS_OPTIONS}
          className="flex-wrap"
        />
      </section>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,200px),1fr))] gap-3">
        {stats.map((stat) => (
          <button
            key={stat.label}
            type="button"
            onClick={stat.go}
            className="cursor-pointer rounded-2xl border border-(--adm-line) bg-(--adm-card) px-5 py-[18px] text-left transition-[border-color,translate] duration-150 hover:-translate-y-0.5 hover:border-(--adm-ink)"
          >
            <div className="font-display text-[40px] leading-none" style={{ color: stat.color }}>
              {stat.n}
            </div>
            <div className="mt-2 text-sm font-bold">{stat.label}</div>
            <div className={cn('text-[13px]', MUTED)}>{stat.sub} →</div>
          </button>
        ))}
      </div>

      <section aria-labelledby="banner-title" className={cn(CARD, CARD_PAD)}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id="banner-title" className="m-0 text-[17px] font-extrabold">
              Aviso no topo do site
            </h2>
            <p className={cn('mt-0.5 mb-0 text-sm', MUTED)}>
              Frete grátis, lançamento, feriado… aparece numa faixa amarela no topo do site.
            </p>
          </div>
          <Switch
            label="Mostrar aviso"
            checked={settings.bannerEnabled}
            disabled={!bannerText.trim()}
            onChange={(on) =>
              void saveSettings(
                { bannerEnabled: on, bannerText: bannerText.trim() },
                on ? 'Aviso publicado no site' : 'Aviso removido do site',
              ).then(() => setBannerDraft(null))
            }
          />
        </div>
        <input
          aria-label="Texto do aviso"
          value={bannerText}
          maxLength={90}
          placeholder="Ex.: Frete grátis acima de R$ 80 hoje!"
          onChange={(event) => setBannerDraft(event.target.value)}
          onBlur={commitBanner}
          onKeyDown={(event) => event.key === 'Enter' && event.currentTarget.blur()}
          className={cn(INPUT, 'mt-3.5')}
        />
        <div className="mt-3 overflow-hidden rounded-[10px] border border-dashed border-(--adm-dashed)">
          <div className={cn('bg-(--adm-faint) px-3 py-1.5 font-mono text-[11px]', MUTED)}>
            prévia{settings.bannerEnabled ? ' · no ar' : ' · desligado'}
          </div>
          <div
            className={cn(
              'px-3.5 py-2.5 text-center text-sm font-bold',
              settings.bannerEnabled ? 'bg-[#f2b53a] text-[#1a1109]' : 'bg-(--adm-banner-off) text-(--adm-muted)',
            )}
          >
            {bannerText || 'Escreva o aviso acima'}
          </div>
        </div>
      </section>

      <div className="flex flex-wrap gap-2.5">
        <button type="button" onClick={onNewProduct} className={cn(BTN_PRIMARY, 'h-[50px] px-[22px]')}>
          + NOVO LANCHE
        </button>
        <button
          type="button"
          onClick={onNewPromotion}
          className="h-[50px] cursor-pointer rounded-xl border-[1.5px] border-(--adm-ink) bg-transparent px-[22px] text-sm font-extrabold tracking-[.04em] text-(--adm-ink) hover:bg-(--adm-ink) hover:text-(--adm-ink-inverse)"
        >
          + NOVA PROMOÇÃO
        </button>
      </div>
    </div>
  );
}
