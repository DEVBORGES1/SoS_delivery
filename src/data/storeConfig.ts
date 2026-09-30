import type { StoreInfo, StoreSettings } from '../types/store';

/**
 * Dados fixos da loja. Nenhum telefone, endereço ou rede social deve ficar
 * espalhado pelos componentes.
 */
export const storeConfig: StoreInfo = {
  name: 'S.O.S Delivery Videira',
  shortName: 'S.O.S Delivery',
  tagline: 'Hambúrguer artesanal feito na hora. Deu fome, chama que a gente resgata.',
  instagram: '@sos_delivery_videira',
  instagramUrl: 'https://www.instagram.com/sos_delivery_videira',
  address: 'Rua Saul Brandalise, 588',
  district: 'Centro',
  city: 'Videira',
  state: 'SC',
  zipCode: '89560-170',
  mapsUrl: 'https://www.google.com/maps/search/?api=1&query=Rua+Saul+Brandalise%2C+588%2C+Centro%2C+Videira+-+SC%2C+89560-170',
  mapsEmbedUrl:
    'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d222.172592263929!2d-51.14831571779113!3d-27.006094084757418!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x94e14e4555dc3de1%3A0x505d49400e7a8d!2sR.%20Saul%20Brandalise%2C%20588%20-%20Centro%2C%20Videira%20-%20SC%2C%2089560-170!5e0!3m2!1spt-BR!2sbr!4v1790743453418!5m2!1spt-BR!2sbr',
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
  whatsapp: '5549988083394',
  bannerEnabled: false,
  bannerText: '',
};
