import { categories } from '../data/categories';
import { products } from '../data/products';
import type { Category, Product } from '../types/product';

export interface Catalog {
  products: Product[];
  categories: Category[];
}

let catalogRequest: Promise<Catalog> | null = null;

/**
 * Único ponto de acesso ao catálogo. Hoje lê os dados locais; quando existir
 * a API REST, basta trocar a implementação por um `fetch` — os componentes
 * continuam consumindo a mesma Promise via `useCatalog`.
 */
export function getCatalog(): Promise<Catalog> {
  catalogRequest ??= Promise.resolve({ products, categories });
  return catalogRequest;
}
