import type { OrderType } from '../types/order';
import type { DeliveryZone } from '../types/store';

/** O que define a taxa de entrega: bairros, taxa única e a promoção de entrega grátis. */
export interface DeliveryConfig {
  /** Só os bairros ativos, na ordem do painel. */
  zones: DeliveryZone[];
  /** Taxa única, usada enquanto nenhum bairro está ativo. */
  fallbackFee: number;
  freeDelivery: boolean;
}

/** Taxa de um pedido. Mesma regra do `create_order` do banco, que é quem vale no fim. */
export interface DeliveryQuote {
  /** Nome do bairro como está cadastrado ('' na retirada ou sem bairro escolhido). */
  district: string;
  /** Taxa cadastrada; `null` na retirada ou enquanto o bairro não foi escolhido. */
  originalFee: number | null;
  /** Taxa cobrada. */
  fee: number;
  freeDelivery: boolean;
}

const NO_FEE: DeliveryQuote = { district: '', originalFee: null, fee: 0, freeDelivery: false };

function normalizeName(name: string): string {
  return name.trim().toLocaleLowerCase('pt-BR');
}

/** Bairros ativos, na ordem do painel (depois por nome). */
export function activeZones(zones: DeliveryZone[]): DeliveryZone[] {
  return zones
    .filter((zone) => zone.active)
    .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name, 'pt-BR'));
}

/** Bairro ativo com esse nome (sem diferenciar maiúsculas). */
export function findZone(zones: DeliveryZone[], district: string): DeliveryZone | undefined {
  const wanted = normalizeName(district);
  return wanted ? zones.find((zone) => zone.active && normalizeName(zone.name) === wanted) : undefined;
}

/**
 * Taxa de entrega do pedido. A promoção de entrega grátis tem prioridade sobre
 * a taxa cadastrada: cobra 0, mas guarda o valor original para mostrar a economia.
 */
export function quoteDelivery(orderType: OrderType, district: string, config: DeliveryConfig): DeliveryQuote {
  if (orderType !== 'delivery') return NO_FEE;

  let originalFee: number | null = config.fallbackFee;
  let name = district.trim();
  if (config.zones.length) {
    const zone = findZone(config.zones, district);
    originalFee = zone?.fee ?? null;
    name = zone?.name ?? '';
  }

  if (originalFee === null) return { ...NO_FEE, freeDelivery: config.freeDelivery };
  return {
    district: name,
    originalFee,
    fee: config.freeDelivery ? 0 : originalFee,
    freeDelivery: config.freeDelivery,
  };
}
