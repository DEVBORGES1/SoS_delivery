/** 0 = domingo … 6 = sábado (mesmo padrão de `Date.getDay()`). */
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

/**
 * Horário de um dia da semana. Horas em número decimal: 19 = 19:00,
 * 19.5 = 19:30, 24 = meia-noite. `null` quando fechado o dia todo.
 */
export interface DayHours {
  day: Weekday;
  opensAt: number | null;
  closesAt: number | null;
}

/** Dias consecutivos com o mesmo horário, agrupados para exibição. */
export interface OpeningHours {
  /** Rótulo completo, usado na seção de contato (ex.: "Quarta a Domingo"). */
  label: string;
  /** Rótulo curto, usado no rodapé (ex.: "Qua a Dom"). */
  shortLabel: string;
  days: Weekday[];
  opensAt: number | null;
  closesAt: number | null;
}

export type StoreStatusOverride = 'auto' | 'open' | 'closed';

/** Dados fixos da loja, editados no código (`src/data/storeConfig.ts`). */
export interface StoreInfo {
  name: string;
  shortName: string;
  tagline: string;
  instagram: string;
  instagramUrl: string;
  address: string;
  district: string;
  city: string;
  state: string;
  zipCode: string;
  mapsUrl: string;
  /** Endereço do mapa incorporado (Google Maps → Compartilhar → Incorporar um mapa). */
  mapsEmbedUrl: string;
  /** Coordenadas da loja (dados estruturados para o Google). */
  geo: { latitude: number; longitude: number };
  /** Endereço público do site, com barra no final. */
  siteUrl: string;
}

/** Configurações que o painel `/admin` altera (tabela `store_settings`). */
export interface StoreSettings {
  /** Força o status da loja (útil para feriados ou folgas). */
  statusOverride: StoreStatusOverride;
  weeklyHours: DayHours[];
  deliveryEnabled: boolean;
  pickupEnabled: boolean;
  /** Taxa única de entrega em reais, usada enquanto nenhum bairro está ativo. 0 = grátis. */
  deliveryFee: number;
  /**
   * Promoção de entrega grátis para todos os bairros. Só zera a cobrança:
   * as taxas cadastradas continuam as mesmas. Muda só pelo `setFreeDelivery` do painel.
   */
  freeDeliveryEnabled: boolean;
  deliveryEta: string;
  pickupEta: string;
  /** Número que recebe os pedidos, só dígitos com DDI + DDD (ex.: 5549988083394). */
  whatsapp: string;
  /** Aviso em faixa amarela no topo do site. */
  bannerEnabled: boolean;
  bannerText: string;
}

export interface StoreStatus {
  isOpen: boolean;
  /** Ex.: "23h" ou "00h". */
  closesAtLabel: string;
  /** Ex.: "hoje", "amanhã", "terça". */
  nextOpenDay: string;
  /** Ex.: "19h". */
  nextOpenTime: string;
  today: Weekday;
}

/** Bairro atendido e a sua taxa de entrega (tabela `delivery_zones`). */
export interface DeliveryZone {
  id: string;
  name: string;
  fee: number;
  /** Bairro inativo some do checkout, mas a taxa fica guardada. */
  active: boolean;
  sortOrder: number;
}
