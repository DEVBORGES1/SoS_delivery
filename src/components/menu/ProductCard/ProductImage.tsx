import type { Product } from '../../../types/product';
import { cn } from '../../../utils/cn';
import { ImagePlaceholder } from '../../ui/ImagePlaceholder/ImagePlaceholder';

interface ProductImageProps {
  product: Product;
  className?: string;
  placeholderLabel?: string;
  placeholderClassName?: string;
  /** `contain` mostra a foto inteira, com a própria arte desfocada preenchendo as sobras. */
  fit?: 'cover' | 'contain';
}

/** Foto do produto ou, na falta dela, o espaço reservado listrado do mockup. */
export function ProductImage({
  product,
  className,
  placeholderLabel,
  placeholderClassName,
  fit = 'cover',
}: ProductImageProps) {
  if (!product.image) {
    return <ImagePlaceholder label={placeholderLabel ?? `foto · ${product.name}`} className={placeholderClassName} />;
  }

  if (fit === 'contain') {
    return (
      <div className={cn('overflow-hidden', className)}>
        <img
          src={product.image}
          alt=""
          aria-hidden="true"
          decoding="async"
          className="absolute inset-0 size-full scale-110 object-cover opacity-60 blur-xl"
        />
        <img
          src={product.image}
          alt={product.name}
          decoding="async"
          className="relative size-full object-contain"
        />
      </div>
    );
  }

  return (
    <img
      src={product.image}
      alt={product.name}
      loading="lazy"
      decoding="async"
      style={{ objectPosition: product.imagePosition }}
      className={cn('size-full object-cover', className)}
    />
  );
}
