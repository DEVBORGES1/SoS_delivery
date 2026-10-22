import { create } from 'zustand';
import { defaultStoreSettings } from '../data/storeConfig';
import type { DeliveryZone, StoreSettings } from '../types/store';

interface SettingsState {
  settings: StoreSettings;
  setSettings: (settings: StoreSettings) => void;
  /** Bairros atendidos e as suas taxas (vazio = vale a taxa única). */
  deliveryZones: DeliveryZone[];
  setDeliveryZones: (zones: DeliveryZone[]) => void;
}

/**
 * Horários, entrega (bairros e taxas) e status da loja. Começa com o padrão do
 * código e é atualizado quando as configurações do Supabase chegam.
 */
export const useSettingsStore = create<SettingsState>()((set) => ({
  settings: defaultStoreSettings,
  setSettings: (settings) => set({ settings }),
  deliveryZones: [],
  setDeliveryZones: (deliveryZones) => set({ deliveryZones }),
}));
