import type { Category } from '../types/product';

/**
 * Categorias disponíveis, na ordem das abas do cardápio. Categorias sem
 * nenhum produto não aparecem no site.
 */
export const categories: Category[] = [
  { id: 'burgers', name: 'Hambúrgueres', emoji: '🍔' },
  { id: 'porcoes', name: 'Porções', emoji: '🍟' },
  { id: 'combos', name: 'Combos', emoji: '🍔' },
  { id: 'bebidas', name: 'Bebidas', emoji: '🥤' },
  { id: 'molhos', name: 'Molhos', emoji: '🥫' },
];
