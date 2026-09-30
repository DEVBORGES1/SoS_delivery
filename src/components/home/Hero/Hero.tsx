import { Plus } from 'lucide-react';
import heroImage from '../../../assets/images/combate-duplo-hero.webp';
import { useStoreStatus } from '../../../hooks/useStoreStatus';
import { useUIStore } from '../../../stores/uiStore';
import type { Product } from '../../../types/product';
import { formatCurrency } from '../../../utils/currency';
import { SectionLink } from '../../layout/SectionLink';
import { buttonClasses } from '../../ui/Button/buttonStyles';
import { ImagePlaceholder } from '../../ui/ImagePlaceholder/ImagePlaceholder';
import { StatusDot } from '../../ui/StatusDot/StatusDot';

interface HeroProps {
  /** Produto em destaque: define a foto da capa e o card flutuante sobre ela. */
  featuredProduct?: Product;
}

/** Foto da capa. O Combate Duplo (e a capa sem destaque) usa o recorte próprio da capa. */
function getHeroPhoto(product?: Product): { src?: string; position?: string } {
  if (!product || (product.imageKey === 'combate-duplo' && !product.imageUrl)) {
    return { src: heroImage, position: '50% 60%' };
  }
  return { src: product.image, position: product.imagePosition };
}

export function Hero({ featuredProduct }: HeroProps) {
  const { isOpen, labels } = useStoreStatus();
  const openProduct = useUIStore((state) => state.openProduct);
  const photo = getHeroPhoto(featuredProduct);
  const photoLabel = featuredProduct?.name ?? 'Hambúrguer artesanal';

  return (
    <section
      id="inicio"
      aria-labelledby="hero-title"
      className="scroll-mt-[72px] overflow-hidden bg-bg px-gutter pt-[clamp(28px,5vw,64px)] pb-[clamp(48px,6vw,80px)]"
    >
      <div className="mx-auto grid max-w-[1280px] grid-cols-[repeat(auto-fit,minmax(min(100%,440px),1fr))] items-center gap-[clamp(32px,5vw,64px)]">
        <div className="@container flex flex-col items-start">
          <span className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3.5 py-2 text-[13px] font-bold tracking-[.04em]">
            <StatusDot isOpen={isOpen} />
            {labels.chip}
          </span>
          {/* Limitar a 19cqi (~5em de texto) garante que a linha mais longa caiba na coluna, sem ficar atrás da foto. */}
          <h1
            id="hero-title"
            className="mt-[22px] font-display text-[clamp(min(58px,19cqi),min(9.5vw,19cqi),142px)] leading-[1.12] font-normal uppercase"
          >
            O resgate
            <br />
            da sua
            <br />
            <span className="text-accent">fome!</span>
          </h1>
          <p className="mt-6 max-w-[460px] text-[clamp(16px,1.5vw,19px)] leading-normal text-pretty text-muted">
            Deu fome? A gente atende o chamado. Blend artesanal, brioche selado na chapa e nada de frescura — feito
            na hora, direto pra sua porta.
          </p>
          <div className="mt-[30px] flex flex-wrap gap-3">
            <SectionLink sectionId="cardapio" className={buttonClasses({ variant: 'cta3d', size: 'xl', shape: 'soft' })}>
              PEDIR AGORA
            </SectionLink>
            <SectionLink
              sectionId="cardapio"
              className={buttonClasses({ variant: 'outlineInk', size: 'xl', shape: 'soft' })}
            >
              VER CARDÁPIO
            </SectionLink>
          </div>
        </div>

        <div className="relative pt-[18px] pl-[18px]">
          <div aria-hidden="true" className="absolute inset-[0_18px_18px_0] -rotate-[2.5deg] rounded-[28px] bg-accent" />
          <div className="relative aspect-[1/0.92] overflow-hidden rounded-[28px] bg-[#1a120c]">
            {photo.src ? (
              <img
                src={photo.src}
                alt={photoLabel}
                width={620}
                height={530}
                fetchPriority="high"
                style={{ objectPosition: photo.position }}
                className="size-full object-cover"
              />
            ) : (
              <ImagePlaceholder label={`foto · ${photoLabel}`} />
            )}
          </div>
          <div
            aria-hidden="true"
            className="absolute top-0 right-[4%] grid aspect-square w-[clamp(96px,11vw,128px)] rotate-10 place-items-center rounded-full bg-mustard text-center text-mustard-ink shadow-sticker"
          >
            <span className="font-display text-[clamp(17px,2vw,22px)] leading-none">
              BLEND
              <br />
              NA BRASA
            </span>
          </div>
          {featuredProduct && (
            <button
              type="button"
              onClick={() => openProduct(featuredProduct)}
              aria-label={`Ver ${featuredProduct.name}, ${formatCurrency(featuredProduct.price)}`}
              className="absolute bottom-[clamp(12px,3vw,32px)] left-[clamp(0px,2vw,24px)] flex items-center gap-3.5 rounded-[18px] bg-surface py-3 pr-3 pl-[18px] text-ink shadow-float transition-transform duration-200 hover:-translate-y-[3px]"
            >
              <span className="flex flex-col text-left leading-[1.1]">
                <span className="font-display text-xl uppercase">{featuredProduct.name}</span>
                <span className="mt-1 text-sm font-bold text-muted">{formatCurrency(featuredProduct.price)}</span>
              </span>
              <span className="grid size-11 place-items-center rounded-xl bg-accent text-white">
                <Plus size={24} strokeWidth={2.2} aria-hidden="true" />
              </span>
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
