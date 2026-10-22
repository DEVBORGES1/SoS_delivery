export type AdminTab = 'orders' | 'overview' | 'menu' | 'promos' | 'fees' | 'store';

export const TABS: { id: AdminTab; label: string; short: string; title: string }[] = [
  { id: 'orders', label: 'Pedidos', short: 'Pedidos', title: 'Pedidos' },
  { id: 'overview', label: 'Visão geral', short: 'Início', title: 'Visão geral' },
  { id: 'menu', label: 'Cardápio', short: 'Cardápio', title: 'Cardápio' },
  { id: 'promos', label: 'Promoções', short: 'Promos', title: 'Promoções' },
  { id: 'fees', label: 'Taxas de entrega', short: 'Taxas', title: 'Taxas de entrega' },
  { id: 'store', label: 'Loja', short: 'Loja', title: 'Configurações da loja' },
];
