import type { Product } from '../../../types/product';
import { cn } from '../../../utils/cn';
import { ImagePlaceholder } from '../../ui/ImagePlaceholder/ImagePlaceholder';

interface ProductImageProps {
  product: Product;
  className?: string;
  placeholderLabel?: string;
  placeholderClassName?: string;
}

/** Foto do produto ou, na falta dela, o espaço reservado listrado do mockup. */
export function ProductImage({ product, className, placeholderLabel, placeholderClassName }: ProductImageProps) {
  if (!product.image) {
    return <ImagePlaceholder label={placeholderLabel ?? `foto · ${product.name}`} className={placeholderClassName} />;
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
