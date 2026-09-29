import type { StoreConfig } from '../types/store';

/**
 * Dados da loja centralizados. Nenhum telefone, endereço ou rede social
 * deve ficar espalhado pelos componentes.
 */
export const storeConfig: StoreConfig = {
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
  deliveryEnabled: true,
  pickupEnabled: true,
  /** Taxa de entrega em reais. 0 = entrega grátis. */
  deliveryFee: 0,
  deliveryEta: '~40 min',
  pickupEta: '~20 min',
  /**
   * Horários de funcionamento. Para alterar, edite as linhas abaixo:
   * - `days`: 0 = domingo, 1 = segunda … 6 = sábado.
   * - `opensAt` / `closesAt`: hora cheia (0–24; 24 = meia-noite).
   * - Dia fechado: `opensAt: null, closesAt: null`.
   * Todo dia da semana deve aparecer em exatamente uma linha.
   */
  openingHours: [
    { label: 'Segunda e Terça', shortLabel: 'Seg e Ter', days: [1, 2], opensAt: null, closesAt: null },
    { label: 'Quarta a Domingo', shortLabel: 'Qua a Dom', days: [3, 4, 5, 6, 0], opensAt: 19, closesAt: 23 },
  ],
  /**
   * 'auto' segue os horários acima. Use 'open' ou 'closed' para forçar o status
   * (feriado, folga, evento) e volte para 'auto' depois.
   */
  statusOverride: 'auto',
};
