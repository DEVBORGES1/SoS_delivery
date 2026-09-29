import type { StoreInfo, StoreSettings } from '../types/store';

/**
 * Dados fixos da loja. Nenhum telefone, endereço ou rede social deve ficar
 * espalhado pelos componentes.
 */
export const storeConfig: StoreInfo = {
  name: 'S.O.S Delivery Videira',
  shortName: 'S.O.S Delivery',
  tagline: 'Hambúrguer artesanal feito na hora. Deu fome, chama que a gente resgata.',
  whatsapp: '5549988083394',
  whatsappDisplay: '(49) 98808-3394',
  instagram: '@sos_delivery_videira',
  instagramUrl: 'https://www.instagram.com/sos_delivery_videira',
  address: 'Rua Saul Brandalise, 588',
  district: 'Centro',
  city: 'Videira',
  state: 'SC',
  zipCode: '89560-170',
  mapsUrl: 'https://www.google.com/maps/search/?api=1&query=Rua+Saul+Brandalise%2C+588%2C+Centro%2C+Videira+-+SC%2C+89560-170',
};

/**
 * Horários, entrega e status da loja. Com o Supabase configurado, estes
 * valores são substituídos pelos salvos no painel `/admin`; aqui ficam só
 * como padrão (e para quando o banco não responder).
 */
export const defaultStoreSettings: StoreSettings = {
  statusOverride: 'auto',
  weeklyHours: [
    { day: 1, opensAt: null, closesAt: null },
    { day: 2, opensAt: null, closesAt: null },
    { day: 3, opensAt: 19, closesAt: 23 },
    { day: 4, opensAt: 19, closesAt: 23 },
    { day: 5, opensAt: 19, closesAt: 23 },
    { day: 6, opensAt: 19, closesAt: 23 },
    { day: 0, opensAt: 19, closesAt: 23 },
  ],
  deliveryEnabled: true,
  pickupEnabled: true,
  deliveryFee: 0,
  deliveryEta: '~40 min',
  pickupEta: '~20 min',
};
