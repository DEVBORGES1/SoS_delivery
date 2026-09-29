import { ArrowDown, ArrowUp, Pencil, Plus } from 'lucide-react';
import { useEffect, useState } from 'react';
import { categories } from '../../data/categories';
import { describeError, supabase } from '../../services/supabaseClient';
import { productFromRow, productToRow, type ProductRow } from '../../services/siteDataMapper';
import type { Product } from '../../types/product';
import { cn } from '../../utils/cn';
import { formatCurrency } from '../../utils/currency';
import { Button } from '../ui/Button/Button';
import { ImagePlaceholder } from '../ui/ImagePlaceholder/ImagePlaceholder';
import { ADMIN_CARD, AdminSectionTitle, FeedbackMessage, Toggle, type Feedback } from './adminUi';
import { ProductForm } from './ProductForm';

/** `undefined` = lista; `null` = novo item; `Product` = editando. */
type Editing = Product | null | undefined;

export function ProductsEditor() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [editing, setEditing] = useState<Editing>(undefined);

  useEffect(() => {
    let active = true;
    supabase
      ?.from('products')
      .select('*')
      .order('sort_order', { ascending: true })
      .order('name', { ascending: true })
      .then(({ data, error }) => {
        if (!active) return;
        if (error) setFeedback({ tone: 'error', message: describeError(error) });
        setProducts((data as ProductRow[] | null)?.map(productFromRow) ?? []);
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  /** Grava a lista inteira na ordem atual (a posição de cada item vira `sort_order`). */
  const persist = async (next: Product[], successMessage: string): Promise<boolean> => {
    if (!supabase) return false;
    setSaving(true);
    const rows = next.map((product, index) => productToRow(product, index));
    const { error } = await supabase.from('products').upsert(rows);
    setSaving(false);

    if (error) {
      setFeedback({ tone: 'error', message: describeError(error) });
      return false;
    }
    setProducts(next);
    setFeedback({ tone: 'success', message: successMessage });
    return true;
  };

  const saveProduct = async (product: Product) => {
    const index = products.findIndex((item) => item.id === product.id);
    const next = index >= 0 ? products.with(index, product) : [...products, product];
    if (await persist(next, `"${product.name}" salvo.`)) setEditing(undefined);
  };

  const toggleAvailable = (product: Product, available: boolean) => {
    if (available && product.price === 0) {
      setFeedback({ tone: 'error', message: `Defina o preço de "${product.name}" antes de deixá-lo disponível.` });
      return;
    }
    const updated = { ...product, available };
    const next = products.map((item) => (item.id === product.id ? updated : item));
    void persist(next, `"${product.name}" ${available ? 'disponível' : 'marcado como esgotado'}.`);
  };

  const move = (product: Product, direction: -1 | 1) => {
    const index = products.indexOf(product);
    const target = index + direction;
    if (target < 0 || target >= products.length) return;
    const next = [...products];
    [next[index], next[target]] = [next[target], next[index]];
    void persist(next, 'Ordem atualizada.');
  };

  const deleteProduct = async (product: Product) => {
    if (!supabase || !window.confirm(`Excluir "${product.name}" do cardápio? Isso não pode ser desfeito.`)) return;
    setSaving(true);
    const { error } = await supabase.from('products').delete().eq('id', product.id);
    setSaving(false);
    if (error) return setFeedback({ tone: 'error', message: describeError(error) });
    setProducts((current) => current.filter((item) => item.id !== product.id));
    setFeedback({ tone: 'success', message: `"${product.name}" excluído.` });
    setEditing(undefined);
  };

  if (editing !== undefined) {
    return (
      <ProductForm
        key={editing?.id ?? 'novo'}
        product={editing}
        existingIds={products.map((product) => product.id)}
        saving={saving}
        feedback={feedback}
        onSave={saveProduct}
        onDelete={editing ? () => deleteProduct(editing) : undefined}
        onCancel={() => {
          setEditing(undefined);
          setFeedback(null);
        }}
      />
    );
  }

  const categoryName = (id: string) => categories.find((category) => category.id === id)?.name ?? id;

  return (
    <section className={ADMIN_CARD} aria-busy={loading}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <AdminSectionTitle description="A ordem aqui é a ordem no site. Itens esgotados aparecem em cinza para o cliente.">
          Cardápio
        </AdminSectionTitle>
        <Button
          size="xs"
          shape="soft"
          onClick={() => {
            setEditing(null);
            setFeedback(null);
          }}
        >
          <Plus size={16} aria-hidden="true" /> NOVO ITEM
        </Button>
      </div>

      <FeedbackMessage feedback={feedback} />

      {loading ? (
        <p className="py-8 text-center text-muted">Carregando cardápio…</p>
      ) : products.length === 0 ? (
        <p className="py-8 text-center text-muted">
          Nenhum item no banco. Rode o arquivo <code>supabase/schema.sql</code> ou crie um novo item.
        </p>
      ) : (
        <ul className="mt-3 flex flex-col divide-y divide-line">
          {products.map((product, index) => (
            <li key={product.id} className="flex flex-wrap items-center gap-3 py-3">
              <div className="size-14 flex-none overflow-hidden rounded-field bg-placeholder">
                {product.image ? (
                  <img
                    src={product.image}
                    alt=""
                    style={{ objectPosition: product.imagePosition }}
                    className={cn('size-full object-cover', !product.available && 'grayscale')}
                  />
                ) : (
                  <ImagePlaceholder label="" className="p-0" />
                )}
              </div>
              <div className="min-w-[160px] flex-1">
                <p className="font-extrabold">{product.name}</p>
                <p className="text-sm text-muted">
                  {categoryName(product.categoryId)} ·{' '}
                  <span className={cn(product.price === 0 && 'font-bold text-danger')}>
                    {product.price === 0 ? 'sem preço' : formatCurrency(product.price)}
                  </span>
                </p>
              </div>
              <Toggle
                checked={product.available}
                disabled={saving}
                onChange={(available) => toggleAvailable(product, available)}
                label={<span className="w-[84px] text-sm">{product.available ? 'Disponível' : 'Esgotado'}</span>}
              />
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  aria-label={`Subir ${product.name}`}
                  disabled={saving || index === 0}
                  onClick={() => move(product, -1)}
                  className="grid size-10 place-items-center rounded-field text-muted hover:bg-line hover:text-ink disabled:opacity-30"
                >
                  <ArrowUp size={18} aria-hidden="true" />
                </button>
                <button
                  type="button"
                  aria-label={`Descer ${product.name}`}
                  disabled={saving || index === products.length - 1}
                  onClick={() => move(product, 1)}
                  className="grid size-10 place-items-center rounded-field text-muted hover:bg-line hover:text-ink disabled:opacity-30"
                >
                  <ArrowDown size={18} aria-hidden="true" />
                </button>
                <Button
                  variant="outline"
                  size="xs"
                  shape="soft"
                  onClick={() => {
                    setEditing(product);
                    setFeedback(null);
                  }}
                  className="h-10 px-3.5"
                >
                  <Pencil size={15} aria-hidden="true" /> Editar
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
