import { useEffect, useMemo } from 'react';
import { refreshDeliveryConfig } from '../services/productService';
import { useSettingsStore } from '../stores/settingsStore';
import { activeZones, type DeliveryConfig } from '../utils/delivery';

/** Releitura periódica enquanto o checkout está aberto. */
const REFRESH_MS = 60_000;

/** Configuração de entrega atual, lida direto do store (para usar fora do React). */
export function getDeliveryConfig(): DeliveryConfig {
  const { deliveryZones, settings } = useSettingsStore.getState();
  return {
    zones: activeZones(deliveryZones),
    fallbackFee: settings.deliveryFee,
    freeDelivery: settings.freeDeliveryEnabled,
  };
}

/** Bairros ativos, taxa única e a promoção de entrega grátis. */
export function useDeliveryConfig(): DeliveryConfig {
  const zones = useSettingsStore((state) => state.deliveryZones);
  const fallbackFee = useSettingsStore((state) => state.settings.deliveryFee);
  const freeDelivery = useSettingsStore((state) => state.settings.freeDeliveryEnabled);
  return useMemo(() => ({ zones: activeZones(zones), fallbackFee, freeDelivery }), [zones, fallbackFee, freeDelivery]);
}

/**
 * Mantém a taxa de entrega em dia enquanto a página está aberta: relê ao abrir,
 * ao voltar para a aba e a cada minuto (a promoção pode ser ligada a qualquer hora).
 */
export function useDeliveryConfigRefresh() {
  useEffect(() => {
    const refresh = () => void refreshDeliveryConfig();
    refresh();
    const timer = setInterval(refresh, REFRESH_MS);
    window.addEventListener('focus', refresh);
    return () => {
      clearInterval(timer);
      window.removeEventListener('focus', refresh);
    };
  }, []);
}
