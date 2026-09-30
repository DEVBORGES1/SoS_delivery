import { ImagePlus, Loader2, Plus, Trash2 } from 'lucide-react';
import { useRef, useState } from 'react';
import { categories } from '../../data/categories';
import { getProductImage, productImages } from '../../data/productImages';
import { describeError } from '../../services/supabaseClient';
import type { Addon, Product } from '../../types/product';
import { cn } from '../../utils/cn';
import { formatCurrency } from '../../utils/currency';
import { parsePrice, priceToInput } from './adminFormat';
import { BTN_OUTLINE, BTN_PRIMARY, ConfirmButton, Drawer, Field, INPUT, LABEL, MUTED, PrefixedInput, Switch } from './adminUi';
import { uploadProductImage } from './imageUpload';
import type { AdminData } from './useAdminData';

const BADGE_SUGGESTIONS = ['Novo', 'Mais pedido', 'Picante', 'Pra dividir'];
const DESCRIPTION_MAX = 140;
const COVER_STICKER_MAX = 24;

interface AddonDraft {
  id: string;
  name: string;
  price: string;
}

function slugify(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function uniqueId(base: string, taken: string[]): string {
  const slug = slugify(base) || 'item';
  let id = slug;
  for (let n = 2; taken.includes(id); n++) id = `${slug}-${n}`;
  return id;
}

interface ProductDrawerProps {
  /** `null` = novo lanche. */
  product: Product | null;
  defaultCategory?: string;
  data: AdminData;
  onClose: () => void;
}

export function ProductDrawer({ product, defaultCategory, data, onClose }: ProductDrawerProps) {
  const isNew = !product;
  const [draft, setDraft] = useState<Product>(
    product ?? {
      id: '',
      categoryId: defaultCategory ?? categories[0].id,
      name: '',
      description: '',
      price: 0,
      badge: 'Novo',
      available: true,
    },
  );
  const [price, setPrice] = useState(() => (product ? priceToInput(product.price) : ''));
  const [addons, setAddons] = useState<AddonDraft[]>(() =>
    (product?.addons ?? []).map((addon) => ({ ...addon, price: priceToInput(addon.price) })),
  );
  const [triedSave, setTriedSave] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  const update = <K extends keyof Product>(field: K, value: Product[K]) =>
    setDraft((current) => ({ ...current, [field]: value }));

  const parsedPrice = parsePrice(price);
  const nameError = triedSave && !draft.name.trim() ? 'Dê um nome ao lanche' : undefined;
  const priceError =
    triedSave && (parsedPrice === null || (draft.available && !(parsedPrice > 0)))
      ? 'Informe o preço (ex.: 32,90)'
      : undefined;
  const image = draft.imageUrl || getProductImage(draft.imageKey);

  const pickLocalImage = (key: string | undefined) =>
    setDraft((current) => ({ ...current, imageKey: key, imageUrl: undefined }));

  const upload = async (file: File | undefined) => {
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadProductImage(file, draft.id || slugify(draft.name));
      setDraft((current) => ({ ...current, imageUrl: url, imageKey: undefined, imagePosition: undefined }));
      data.notify('Foto enviada');
    } catch (error) {
      data.notify(describeError(error), 'error');
    } finally {
      setUploading(false);
      if (fileInput.current) fileInput.current.value = '';
    }
  };

  const save = async () => {
    setTriedSave(true);
    if (!draft.name.trim() || parsedPrice === null || (draft.available && !(parsedPrice > 0))) return;

    const parsedAddons: Addon[] = [];
    for (const addon of addons) {
      if (!addon.name.trim()) continue;
      const addonPrice = parsePrice(addon.price);
      if (addonPrice === null) return data.notify(`Preço inválido no adicional "${addon.name}"`, 'error');
      parsedAddons.push({
        id: addon.id || uniqueId(addon.name, parsedAddons.map((item) => item.id)),
        name: addon.name.trim(),
        price: addonPrice,
      });
    }

    const saved: Product = {
      ...draft,
      id: draft.id || uniqueId(draft.name, data.products.map((item) => item.id)),
      name: draft.name.trim(),
      description: draft.description.trim(),
      badge: draft.badge?.trim() || undefined,
      coverSticker: draft.coverSticker?.trim() ?? '',
      price: parsedPrice,
      image,
      addons: parsedAddons.length ? parsedAddons : undefined,
    };
    const ok = await data.saveProduct(saved, isNew ? `${saved.name} adicionado ao cardápio` : `${saved.name} atualizado`);
    if (ok) onClose();
  };

  const remove = async () => {
    if (!product) return;
    if (!confirmDelete) return setConfirmDelete(true);
    if (await data.deleteProduct(product)) onClose();
  };

  const imageTile = (selected: boolean) =>
    cn(
      'relative grid aspect-square cursor-pointer place-items-center overflow-hidden rounded-[10px] border-[3px] bg-(--adm-thumb) bg-[repeating-linear-gradient(135deg,var(--adm-stripe)_0_8px,transparent_8px_16px)] p-0 text-[11px] font-bold text-(--adm-muted)',
      selected ? 'border-(--adm-accent)' : 'border-transparent',
    );

  return (
    <Drawer
      title={isNew ? 'Novo lanche' : 'Editar lanche'}
      width="wide"
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
            disabled={data.saving || uploading}
            className={cn(BTN_PRIMARY, 'h-[50px] px-[22px]')}
          >
            {data.saving ? 'SALVANDO…' : 'SALVAR'}
          </button>
        </>
      }
    >
      <div className="grid items-start gap-6 min-[640px]:grid-cols-[minmax(0,1fr)_250px]">
        <div className="flex min-w-0 flex-col gap-4">
          <Field id="e-name" label="Nome do lanche" error={nameError}>
            <input
              id="e-name"
              value={draft.name}
              placeholder="Ex.: Plantão Noturno"
              onChange={(event) => update('name', event.target.value)}
              className={cn(INPUT, nameError && 'border-(--adm-danger)')}
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field id="e-cat" label="Categoria">
              <select
                id="e-cat"
                value={draft.categoryId}
                onChange={(event) => update('categoryId', event.target.value)}
                className={cn(INPUT, 'px-3')}
              >
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field id="e-price" label="Preço" error={priceError}>
              <PrefixedInput
                id="e-price"
                prefix="R$"
                inputMode="decimal"
                placeholder="29,90"
                value={price}
                invalid={!!priceError}
                onChange={(event) => setPrice(event.target.value)}
              />
            </Field>
          </div>
          <Field
            id="e-desc"
            label={
              <>
                Descrição{' '}
                <span className={cn('font-medium', MUTED)}>
                  · {draft.description.length}/{DESCRIPTION_MAX}
                </span>
              </>
            }
          >
            <textarea
              id="e-desc"
              rows={3}
              maxLength={DESCRIPTION_MAX}
              value={draft.description}
              placeholder="Pão, carne, queijo, molho…"
              onChange={(event) => update('description', event.target.value)}
              className={cn(INPUT, 'h-auto resize-y py-3 leading-[1.45]')}
            />
          </Field>

          <div className="flex flex-col gap-2">
            <span className={LABEL}>Foto</span>
            <div className="grid grid-cols-[repeat(auto-fill,minmax(84px,1fr))] gap-2">
              <button
                type="button"
                onClick={() => fileInput.current?.click()}
                disabled={uploading}
                aria-label="Enviar foto do celular ou do computador"
                className={cn(imageTile(false), 'border-dashed border-(--adm-dashed) bg-(--adm-card) bg-none')}
              >
                <span className="flex flex-col items-center gap-1 px-1 text-center">
                  {uploading ? (
                    <Loader2 size={20} className="animate-spin" aria-hidden="true" />
                  ) : (
                    <ImagePlus size={20} aria-hidden="true" />
                  )}
                  {uploading ? 'Enviando…' : 'Enviar foto'}
                </span>
              </button>
              <button
                type="button"
                aria-pressed={!image}
                onClick={() => pickLocalImage(undefined)}
                className={imageTile(!image)}
              >
                Sem foto
              </button>
              {draft.imageUrl && (
                <button type="button" aria-pressed aria-label="Foto enviada" className={imageTile(true)}>
                  <img src={draft.imageUrl} alt="" className="size-full object-cover" />
                </button>
              )}
              {Object.entries(productImages).map(([key, { label, src }]) => {
                const selected = !draft.imageUrl && draft.imageKey === key;
                return (
                  <button
                    key={key}
                    type="button"
                    aria-pressed={selected}
                    aria-label={label}
                    title={label}
                    onClick={() => pickLocalImage(key)}
                    className={imageTile(selected)}
                  >
                    <img src={src} alt="" loading="lazy" className="size-full object-cover" />
                  </button>
                );
              })}
            </div>
            <input
              ref={fileInput}
              type="file"
              accept="image/*"
              className="sr-only"
              tabIndex={-1}
              onChange={(event) => void upload(event.target.files?.[0])}
            />
            <span className={cn('text-[12.5px]', MUTED)}>
              Tire a foto na hora ou escolha da galeria. Ela é reduzida automaticamente antes de enviar.
            </span>
          </div>

          <Field id="e-badge" label={<>Selo <span className={cn('font-medium', MUTED)}>(opcional)</span></>}>
            <input
              id="e-badge"
              value={draft.badge ?? ''}
              maxLength={18}
              placeholder="Novo, Mais pedido, Picante…"
              onChange={(event) => update('badge', event.target.value)}
              className={INPUT}
            />
            <div className="flex flex-wrap gap-1.5">
              {[...BADGE_SUGGESTIONS, 'Sem selo'].map((label) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => update('badge', label === 'Sem selo' ? '' : label)}
                  className="h-8 cursor-pointer rounded-full border border-(--adm-line) bg-(--adm-faint) px-3 text-[13px] font-semibold text-(--adm-ink)"
                >
                  {label}
                </button>
              ))}
            </div>
          </Field>

          <div className="flex items-center justify-between gap-3 rounded-xl bg-(--adm-faint) px-4 py-3.5">
            <div>
              <div className="font-bold">Disponível no site</div>
              <div className={cn('text-[13px]', MUTED)}>Desligue quando acabar o ingrediente.</div>
            </div>
            <Switch label="Disponível" checked={draft.available} onChange={(value) => update('available', value)} />
          </div>

          <div className="flex items-center justify-between gap-3 rounded-xl bg-(--adm-faint) px-4 py-3.5">
            <div>
              <div className="font-bold">Destaque na capa</div>
              <div className={cn('text-[13px]', MUTED)}>Vira a foto principal do site. Só um lanche fica em destaque por vez.</div>
            </div>
            <Switch
              label="Destaque na capa"
              checked={draft.featured ?? false}
              onChange={(value) => update('featured', value)}
            />
          </div>
          {draft.featured && (
            <Field
              id="e-cover-sticker"
              label={<>Selo da capa <span className={cn('font-medium', MUTED)}>(opcional)</span></>}
              hint="Círculo amarelo sobre a foto principal. Deixe vazio para não mostrar."
            >
              <input
                id="e-cover-sticker"
                value={draft.coverSticker ?? ''}
                maxLength={COVER_STICKER_MAX}
                placeholder="Ex.: Blend na brasa"
                onChange={(event) => update('coverSticker', event.target.value)}
                className={INPUT}
              />
            </Field>
          )}

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between gap-3">
              <div>
                <span className={LABEL}>Adicionais</span>
                <div className={cn('text-[13px]', MUTED)}>Opcionais que o cliente inclui no lanche (bacon, cheddar…).</div>
              </div>
              <button
                type="button"
                onClick={() => setAddons((current) => [...current, { id: '', name: '', price: '' }])}
                className={cn(BTN_OUTLINE, 'h-10 px-3')}
              >
                <Plus size={15} aria-hidden="true" /> Adicional
              </button>
            </div>
            {addons.map((addon, index) => (
              <div key={index} className="flex items-center gap-2">
                <input
                  aria-label="Nome do adicional"
                  placeholder="Bacon"
                  value={addon.name}
                  onChange={(event) =>
                    setAddons((current) =>
                      current.map((item, i) => (i === index ? { ...item, name: event.target.value } : item)),
                    )
                  }
                  className={cn(INPUT, 'h-11')}
                />
                <PrefixedInput
                  prefix="R$"
                  compact
                  aria-label="Preço do adicional"
                  placeholder="5,00"
                  inputMode="decimal"
                  value={addon.price}
                  onChange={(event) =>
                    setAddons((current) =>
                      current.map((item, i) => (i === index ? { ...item, price: event.target.value } : item)),
                    )
                  }
                  className="w-[124px] flex-none"
                />
                <button
                  type="button"
                  aria-label={`Remover ${addon.name || 'adicional'}`}
                  onClick={() => setAddons((current) => current.filter((_, i) => i !== index))}
                  className="grid size-11 flex-none cursor-pointer place-items-center rounded-[10px] text-(--adm-muted) hover:bg-(--adm-soft) hover:text-(--adm-danger)"
                >
                  <Trash2 size={18} aria-hidden="true" />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="sticky top-0 flex flex-col gap-2">
          <span className={cn('font-mono text-[11px]', MUTED)}>prévia no site</span>
          <div
            className={cn(
              'overflow-hidden rounded-[18px] border border-(--adm-line) bg-surface',
              !draft.available && 'opacity-60',
            )}
          >
            <div className="relative grid aspect-4/3 place-items-center bg-placeholder bg-stripes">
              {image ? (
                <img
                  src={image}
                  alt=""
                  style={{ objectPosition: draft.imagePosition }}
                  className={cn('absolute inset-0 size-full object-cover', !draft.available && 'grayscale')}
                />
              ) : (
                <span className={cn('font-mono text-[11px]', MUTED)}>foto</span>
              )}
              {draft.badge?.trim() && draft.available && (
                <span className="absolute top-2.5 left-2.5 rounded-[5px] bg-[#f2b53a] px-2 py-[3px] text-[11px] font-extrabold text-[#1a1109] uppercase">
                  {draft.badge}
                </span>
              )}
            </div>
            <div className="px-4 pt-3.5 pb-4">
              <div className="font-display text-[22px] leading-[1.1] uppercase">{draft.name || 'Nome do lanche'}</div>
              <div className={cn('mt-1 line-clamp-3 text-[13px] leading-[1.4]', MUTED)}>
                {draft.description || 'Descrição curta dos ingredientes.'}
              </div>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-lg font-extrabold">
                  {parsedPrice && parsedPrice > 0 ? formatCurrency(parsedPrice) : 'R$ 0,00'}
                </span>
                <span className="flex h-9 items-center rounded-full border-[1.5px] border-(--adm-line) px-3.5 text-xs font-extrabold">
                  {draft.available ? 'Adicionar +' : 'Esgotado'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Drawer>
  );
}
