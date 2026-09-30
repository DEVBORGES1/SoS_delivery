import { useState } from 'react';
import { categories } from '../../data/categories';
import type { Product, Promotion } from '../../types/product';
import { cn } from '../../utils/cn';
import { formatCurrency } from '../../utils/currency';
import { calculatePromoPrice, isPromotionLive } from '../../utils/promotions';
import { parsePrice, priceToInput } from './adminFormat';
import { BTN_OUTLINE, BTN_PRIMARY, Chips, INPUT, MUTED, PrefixedInput, Switch, Thumb } from './adminUi';
import type { AdminData } from './useAdminData';

const CATEGORY_LABEL = Object.fromEntries(categories.map((category) => [category.id, category.name]));

interface ProductRowProps {
  product: Product;
  promotion?: Promotion;
  saving: boolean;
  onPrice: (price: number) => void;
  onAvailable: (available: boolean) => void;
  onEdit: () => void;
}

function ProductRow({ product, promotion, saving, onPrice, onAvailable, onEdit }: ProductRowProps) {
  const [draft, setDraft] = useState<string | null>(null);
  const value = draft ?? priceToInput(product.price);

  const commit = () => {
    if (draft === null) return;
    const price = parsePrice(draft);
    setDraft(null);
    if (price !== null && price !== product.price) onPrice(price);
  };

  return (
    <div
      className={cn(
        'flex flex-wrap items-center gap-x-4 gap-y-3 border-b border-(--adm-divider) px-[clamp(14px,2vw,20px)] py-3.5 last:border-b-0',
        !product.available && 'opacity-60',
      )}
    >
      <div className="flex min-w-0 flex-[1_1_240px] items-center gap-3.5">
        <Thumb src={product.image} className="size-14" />
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-base font-extrabold">{product.name}</span>
            {promotion && product.price > 0 && (
              <span className="rounded-[5px] bg-[#f2b53a] px-[7px] py-0.5 text-[11px] font-extrabold text-[#1a1109]">
                PROMO {formatCurrency(calculatePromoPrice(product.price, promotion))}
              </span>
            )}
            {!product.available && (
              <span className="rounded-[5px] bg-(--adm-ink) px-[7px] py-0.5 text-[11px] font-extrabold text-(--adm-ink-inverse)">
                ESGOTADO
              </span>
            )}
          </div>
          <div className={cn('text-[13px]', MUTED)}>
            {CATEGORY_LABEL[product.categoryId] ?? product.categoryId}
            {product.badge && ` · selo “${product.badge}”`}
            {product.price === 0 && <span className="font-bold text-(--adm-danger)"> · sem preço</span>}
          </div>
        </div>
      </div>
      <div className="ml-auto flex items-center gap-3.5">
        <PrefixedInput
          prefix="R$"
          compact
          aria-label={`Preço de ${product.name}`}
          title="Preço — edite e aperte Enter"
          inputMode="decimal"
          value={value}
          onChange={(event) => setDraft(event.target.value)}
          onBlur={commit}
          onKeyDown={(event) => event.key === 'Enter' && event.currentTarget.blur()}
          className="w-[124px]"
        />
        <div className="flex flex-col items-center gap-0.5">
          <Switch
            label={`Disponível: ${product.name}`}
            checked={product.available}
            disabled={saving}
            onChange={onAvailable}
          />
          <span className={cn('text-[11px] font-bold', MUTED)}>{product.available ? 'No site' : 'Esgotado'}</span>
        </div>
        <button type="button" onClick={onEdit} className={BTN_OUTLINE}>
          Editar
        </button>
      </div>
    </div>
  );
}

interface MenuTabProps {
  data: AdminData;
  onEdit: (product: Product) => void;
  onNew: (categoryId?: string) => void;
}

export function MenuTab({ data, onEdit, onNew }: MenuTabProps) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const { products, promotions, saving, saveProduct, notify } = data;

  const search = query.trim().toLowerCase();
  const rows = products.filter(
    (product) =>
      (category === 'all' || product.categoryId === category) && (!search || product.name.toLowerCase().includes(search)),
  );
  const livePromotion = (id: string) =>
    promotions.find((promotion) => promotion.productId === id && isPromotionLive(promotion));

  const chipOptions = [
    { id: 'all', label: 'Todos', count: products.length },
    ...categories.map((item) => ({
      id: item.id,
      label: item.name,
      count: products.filter((product) => product.categoryId === item.id).length,
    })),
  ];

  const setAvailable = (product: Product, available: boolean) => {
    if (available && product.price === 0) {
      notify(`Defina o preço de ${product.name} antes de colocar no site`, 'error');
      return;
    }
    void saveProduct(
      { ...product, available },
      available ? `${product.name} voltou ao cardápio` : `${product.name} marcado como esgotado`,
    );
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2.5">
        <input
          type="search"
          aria-label="Buscar produto"
          placeholder="Buscar lanche…"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          className={cn(INPUT, 'h-12 flex-[1_1_220px] rounded-xl')}
        />
        <button type="button" onClick={() => onNew(category === 'all' ? undefined : category)} className={BTN_PRIMARY}>
          + NOVO LANCHE
        </button>
      </div>
      <Chips ariaLabel="Filtrar categoria" value={category} onChange={setCategory} options={chipOptions} />
      <div className="overflow-hidden rounded-[18px] border border-(--adm-line) bg-(--adm-card)">
        {rows.map((product) => (
          <ProductRow
            key={product.id}
            product={product}
            promotion={livePromotion(product.id)}
            saving={saving}
            onPrice={(price) => {
              if (price === 0 && product.available) {
                notify('Para zerar o preço, marque o item como esgotado primeiro', 'error');
                return;
              }
              void saveProduct({ ...product, price }, `${product.name}: ${formatCurrency(price)}`);
            }}
            onAvailable={(available) => setAvailable(product, available)}
            onEdit={() => onEdit(product)}
          />
        ))}
        {rows.length === 0 && (
          <div className={cn('px-5 py-10 text-center', MUTED)}>
            {data.loading ? 'Carregando cardápio…' : 'Nenhum produto encontrado.'}
          </div>
        )}
      </div>
      <p className={cn('m-0 text-[13px]', MUTED)}>
        Dica: altere o preço direto na lista e aperte Enter. O interruptor marca o item como esgotado no site na hora.
      </p>
    </div>
  );
}
