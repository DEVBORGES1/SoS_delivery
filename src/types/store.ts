/** 0 = domingo … 6 = sábado (mesmo padrão de `Date.getDay()`). */
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export interface OpeningHours {
  /** Rótulo completo, usado na seção de contato. */
  label: string;
  /** Rótulo curto, usado no rodapé. */
  shortLabel: string;
  days: Weekday[];
  /** Hora de abertura (0–23). `null` quando fechado o dia todo. */
  opensAt: number | null;
  /** Hora de fechamento (1–24). 24 = meia-noite. */
  closesAt: number | null;
}

export type StoreStatusOverride = 'auto' | 'open' | 'closed';

export interface StoreConfig {
  name: string;
  shortName: string;
  tagline: string;
  whatsapp: string;
  whatsappDisplay: string;
  instagram: string;
  instagramUrl: string;
  address: string;
  district: string;
  city: string;
  state: string;
  zipCode: string;
  mapsUrl: string;
  deliveryEnabled: boolean;
  pickupEnabled: boolean;
  deliveryFee: number;
  deliveryEta: string;
  pickupEta: string;
  openingHours: OpeningHours[];
  /** Força o status da loja (útil para testes ou feriados). */
  statusOverride: StoreStatusOverride;
}

export interface StoreStatus {
  isOpen: boolean;
  /** Ex.: "23h" ou "00h". */
  closesAtLabel: string;
  /** Ex.: "hoje", "amanhã", "terça". */
  nextOpenDay: string;
  /** Ex.: "18h". */
  nextOpenTime: string;
  today: Weekday;
}
