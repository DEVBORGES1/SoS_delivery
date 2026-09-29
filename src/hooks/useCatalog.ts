import { use } from 'react';
import { getCatalog, type Catalog } from '../services/productService';

/** Lê o catálogo via Suspense. Deve ser usado dentro de um `<Suspense>`. */
export function useCatalog(): Catalog {
  return use(getCatalog());
}
