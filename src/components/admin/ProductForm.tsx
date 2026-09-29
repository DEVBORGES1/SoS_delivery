import { Plus, Trash2 } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { categories } from '../../data/categories';
import { getProductImage, productImages } from '../../data/productImages';
import type { Addon, Product } from '../../types/product';
import { Button } from '../ui/Button/Button';
import { ImagePlaceholder } from '../ui/ImagePlaceholder/ImagePlaceholder';
import { ADMIN_CARD, ADMIN_INPUT, AdminInput, AdminSelect, FeedbackMessage, Toggle, type Feedback } from './adminUi';
import { parsePrice, priceToInput } from './priceInput';

interface AddonDraft {
  id: string;
  name: string;
  price: string;
}

interface ProductFormProps {
  /** `null` = novo item. */
  product: Product | null;
  existingIds: string[];
  saving: boolean;
  feedback: Feedback;
  onSave: (product: Product) => void;
  onDelete?: () => void;
  onCancel: () => void;
}

function slugify(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function uniqueId(base: string, existingIds: string[]): string {
  const slug = slugify(base) || 'item';
  let id = slug;
  for (let n = 2; existingIds.includes(id); n++) id = `${slug}-${n}`;
  return id;
}

const EMPTY_PRODUCT: Product = {
  id: '',
  categoryId: categories[0].id,
  name: '',
  description: '',
  price: 0,
  available: true,
};

export function ProductForm({ product, existingIds, saving, feedback, onSave, onDelete, onCancel }: ProductFormProps) {
  const initial = product ?? EMPTY_PRODUCT;
  const [draft, setDraft] = useState<Product>(initial);
  const [price, setPrice] = useState(() => priceToInput(initial.price));
  const [addons, setAddons] = useState<AddonDraft[]>(() =>
    (initial.addons ?? []).map((addon) => ({ ...addon, price: priceToInput(addon.price) })),
  );
  const [error, setError] = useState<Feedback>(null);

  const update = <K extends keyof Product>(field: K, value: Product[K]) => {
    setDraft((current) => ({ ...current, [field]: value }));
    setError(null);
  };

  const updateAddon = (index: number, patch: Partial<AddonDraft>) => {
    setAddons((current) => current.map((addon, i) => (i === index ? { ...addon, ...patch } : addon)));
    setError(null);
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const parsedPrice = parsePrice(price);
    if (!draft.name.trim()) return setError({ tone: 'error', message: 'Informe o nome do item.' });
    if (parsedPrice === null) return setError({ tone: 'error', message: 'Preço inválido. Ex.: 32,90' });
    if (draft.available && parsedPrice === 0) {
      return setError({ tone: 'error', message: 'Defina o preço antes de deixar o item disponível.' });
    }

    const parsedAddons: Addon[] = [];
    for (const addon of addons) {
      const addonPrice = parsePrice(addon.price);
      if (!addon.name.trim()) continue;
      if (addonPrice === null) return setError({ tone: 'error', message: `Preço inválido no adicional "${addon.name}".` });
      const addonId = addon.id || uniqueId(addon.name, parsedAddons.map((item) => item.id));
      parsedAddons.push({ id: addonId, name: addon.name.trim(), price: addonPrice });
    }

    onSave({
      ...draft,
      id: draft.id || uniqueId(draft.name, existingIds),
      name: draft.name.trim(),
      description: draft.description.trim(),
      badge: draft.badge?.trim() || undefined,
      price: parsedPrice,
      addons: parsedAddons.length ? parsedAddons : undefined,
      image: getProductImage(draft.imageKey),
    });
  };

  const image = getProductImage(draft.imageKey);

  return (
    <form onSubmit={submit} className={ADMIN_CARD}>
      <div className="mb-5 flex items-start justify-between gap-3">
        <h2 className="font-display text-[clamp(26px,3.5vw,34px)] leading-none uppercase">
          {product ? `Editar ${product.name}` : 'Novo item'}
        </h2>
        <Button variant="ghost" size="xs" onClick={onCancel} className="h-auto px-0">
          Voltar
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-[1fr_220px]">
        <div className="grid gap-4 sm:grid-cols-2">
          <AdminInput
            id="product-name"
            label="Nome"
            required
            value={draft.name}
            onChange={(event) => update('name', event.target.value)}
            className="sm:col-span-2"
          />
          <AdminSelect
            id="product-category"
            label="Categoria"
            value={draft.categoryId}
            onChange={(event) => update('categoryId', event.target.value)}
          >
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </AdminSelect>
          <AdminInput
            id="product-price"
            label="Preço (R$)"
            inputMode="decimal"
            placeholder="32,90"
            value={price}
            onChange={(event) => {
              setPrice(event.target.value);
              setError(null);
            }}
          />
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <label htmlFor="product-description" className="text-sm font-bold">
              Descrição
            </label>
            <textarea
              id="product-description"
              rows={3}
              value={draft.description}
              onChange={(event) => update('description', event.target.value)}
              className={`${ADMIN_INPUT} h-auto resize-y py-2.5 leading-[1.45]`}
            />
          </div>
          <AdminInput
            id="product-badge"
            label="Selo (opcional)"
            placeholder="Mais pedido, Novo…"
            maxLength={24}
            value={draft.badge ?? ''}
            onChange={(event) => update('badge', event.target.value)}
          />
          <AdminSelect
            id="product-image"
            label="Foto"
            value={draft.imageKey ?? ''}
            onChange={(event) => update('imageKey', event.target.value || undefined)}
          >
            <option value="">Sem foto</option>
            {Object.entries(productImages).map(([key, { label }]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </AdminSelect>
        </div>

        <div className="flex flex-col gap-4">
          <div className="aspect-4/3 overflow-hidden rounded-control bg-placeholder">
            {image ? (
              <img
                src={image}
                alt=""
                style={{ objectPosition: draft.imagePosition }}
                className="size-full object-cover"
              />
            ) : (
              <ImagePlaceholder label="sem foto" />
            )}
          </div>
          <Toggle checked={draft.available} onChange={(value) => update('available', value)} label="Disponível" />
          <Toggle
            checked={draft.featured ?? false}
            onChange={(value) => update('featured', value)}
            label="Destaque na capa"
          />
        </div>
      </div>

      <fieldset className="mt-6 border-t border-line pt-5">
        <legend className="sr-only">Adicionais</legend>
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <p className="font-extrabold">Adicionais</p>
            <p className="text-sm text-muted">Opcionais que o cliente pode incluir (bacon, cheddar…).</p>
          </div>
          <Button
            variant="outline"
            size="xs"
            shape="soft"
            onClick={() => setAddons((current) => [...current, { id: '', name: '', price: '' }])}
          >
            <Plus size={16} aria-hidden="true" /> Adicional
          </Button>
        </div>
        {addons.length > 0 && (
          <ul className="flex flex-col gap-2">
            {addons.map((addon, index) => (
              <li key={index} className="flex items-center gap-2">
                <input
                  aria-label="Nome do adicional"
                  placeholder="Bacon"
                  value={addon.name}
                  onChange={(event) => updateAddon(index, { name: event.target.value })}
                  className={ADMIN_INPUT}
                />
                <input
                  aria-label="Preço do adicional"
                  placeholder="5,00"
                  inputMode="decimal"
                  value={addon.price}
                  onChange={(event) => updateAddon(index, { price: event.target.value })}
                  className={`${ADMIN_INPUT} w-28 flex-none`}
                />
                <button
                  type="button"
                  aria-label={`Remover ${addon.name || 'adicional'}`}
                  onClick={() => setAddons((current) => current.filter((_, i) => i !== index))}
                  className="grid size-11 flex-none place-items-center rounded-field text-muted hover:bg-line hover:text-danger"
                >
                  <Trash2 size={18} aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </fieldset>

      <div className="mt-6 flex flex-col gap-3 border-t border-line pt-5 sm:flex-row sm:items-center">
        <div className="flex-1">
          <FeedbackMessage feedback={error ?? feedback} />
        </div>
        {onDelete && (
          <Button variant="ghost" size="md" onClick={onDelete} disabled={saving} className="text-danger">
            Excluir item
          </Button>
        )}
        <Button type="submit" size="md" shape="soft" disabled={saving}>
          {saving ? 'SALVANDO…' : 'SALVAR ITEM'}
        </Button>
      </div>
    </form>
  );
}
