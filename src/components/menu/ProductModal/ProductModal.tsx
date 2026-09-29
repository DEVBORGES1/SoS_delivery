import { X } from 'lucide-react';
import { useUIStore } from '../../../stores/uiStore';
import type { Product } from '../../../types/product';
import { formatCurrency } from '../../../utils/currency';
import { Badge } from '../../ui/Badge/Badge';
import { Dialog } from '../../ui/Dialog/Dialog';
import { TextAreaField } from '../../ui/Input/TextField';
import { QuantityStepper } from '../../ui/QuantityStepper/QuantityStepper';
import { ProductImage } from '../ProductCard/ProductImage';
import { AddonOption } from './AddonOption';
import { AddToCartButton } from './AddToCartButton';
import { useProductCustomization } from './useProductCustomization';

const TITLE_ID = 'product-modal-title';

function ProductModalContent({ product, onClose }: { product: Product; onClose: () => void }) {
  const customization = useProductCustomization(product, onClose);
  const addons = product.addons ?? [];

  return (
    <>
      <div className="bg-stripes relative h-[230px] w-full flex-none md:h-auto md:w-[46%]">
        <ProductImage product={product} className="absolute inset-0" />
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar"
          className="absolute top-3.5 right-3.5 grid size-11 place-items-center rounded-full bg-[rgb(15_11_8/0.7)] text-white backdrop-blur-[6px]"
        >
          <X size={18} aria-hidden="true" />
        </button>
        {product.badge && product.available && (
          <Badge className="absolute top-[18px] left-[18px]">{product.badge}</Badge>
        )}
      </div>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <div className="flex-1 overflow-auto p-[clamp(20px,3vw,32px)]">
          <h2 id={TITLE_ID} className="font-display text-[clamp(34px,4vw,46px)] leading-none uppercase">
            {product.name}
          </h2>
          <p className="mt-2.5 text-[15.5px] leading-normal text-muted">{product.description}</p>
          <p className="mt-3 text-[22px] font-extrabold">{formatCurrency(product.price)}</p>

          <div className="mt-[22px] flex items-center justify-between border-y border-line py-3.5">
            <span className="text-base font-extrabold">Quantidade</span>
            <QuantityStepper
              value={customization.quantity}
              onIncrement={customization.increment}
              onDecrement={customization.decrement}
              incrementLabel="Aumentar quantidade"
              decrementLabel="Diminuir quantidade"
              highlightIncrement
            />
          </div>

          {addons.length > 0 && (
            <fieldset className="mt-5">
              <legend className="text-base font-extrabold">
                Turbine seu lanche <span className="text-sm font-medium text-muted">· opcional</span>
              </legend>
              <div className="mt-2.5 flex flex-col gap-2">
                {addons.map((addon) => (
                  <AddonOption
                    key={addon.id}
                    addon={addon}
                    checked={customization.selectedAddonIds.includes(addon.id)}
                    onToggle={customization.toggleAddon}
                  />
                ))}
              </div>
            </fieldset>
          )}

          <TextAreaField
            id="product-note"
            label="Observação"
            emphasizedLabel
            rows={2}
            placeholder="Ex.: sem cebola, ponto da carne bem passado"
            value={customization.note}
            onChange={(event) => customization.setNote(event.target.value)}
            className="mt-5"
          />
        </div>

        <div className="border-t border-line bg-surface px-[clamp(20px,3vw,32px)] pt-3.5 pb-[18px]">
          <AddToCartButton
            available={product.available}
            isAdded={customization.isAdded}
            total={customization.total}
            highlightKey={customization.highlightKey}
            onClick={customization.confirm}
          />
        </div>
      </div>
    </>
  );
}

export function ProductModal() {
  const product = useUIStore((state) => state.selectedProduct);
  const isOpen = useUIStore((state) => state.isProductModalOpen);
  const session = useUIStore((state) => state.productModalSession);
  const close = useUIStore((state) => state.closeProductModal);

  return (
    <Dialog
      open={isOpen}
      onClose={close}
      variant="modal"
      ariaLabelledBy={TITLE_ID}
      className="flex-col overflow-hidden md:flex-row"
    >
      {product && <ProductModalContent key={session} product={product} onClose={close} />}
    </Dialog>
  );
}
