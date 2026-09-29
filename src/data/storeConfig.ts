import type { StoreConfig } from '../types/store';

/**
 * Dados da loja centralizados. Nenhum telefone, endereço ou rede social
 * deve ficar espalhado pelos componentes.
 */
export const storeConfig: StoreConfig = {
  name: 'S.O.S Delivery Videira',
  shortName: 'S.O.S Delivery',
  tagline: 'Hambúrguer artesanal feito na hora. Deu fome, chama que a gente resgata.',
  whatsapp: '5549999999999',
  whatsappDisplay: '(49) 99999-9999',
  instagram: '@sosdeliveryvideira',
  instagramUrl: 'https://instagram.com/sosdeliveryvideira',
  address: 'Rua Exemplo, 123',
  district: 'Centro',
  city: 'Videira',
  state: 'SC',
  zipCode: '89560-000',
  mapsUrl: 'https://maps.google.com/?q=Videira+SC',
  deliveryEnabled: true,
  pickupEnabled: true,
  deliveryFee: 6,
  deliveryEta: '~40 min',
  pickupEta: '~20 min',
  openingHours: [
    { label: 'Segunda', shortLabel: 'Segunda', days: [1], opensAt: null, closesAt: null },
    { label: 'Terça a Quinta', shortLabel: 'Ter a Qui', days: [2, 3, 4], opensAt: 18, closesAt: 23 },
    { label: 'Sexta e Sábado', shortLabel: 'Sex e Sáb', days: [5, 6], opensAt: 18, closesAt: 24 },
    { label: 'Domingo', shortLabel: 'Dom', days: [0], opensAt: 18, closesAt: 23 },
  ],
  statusOverride: 'auto',
};
