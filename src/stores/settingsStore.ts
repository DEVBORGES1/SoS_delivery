import { create } from 'zustand';
import { defaultStoreSettings } from '../data/storeConfig';
import type { StoreSettings } from '../types/store';

interface SettingsState {
  settings: StoreSettings;
  setSettings: (settings: StoreSettings) => void;
}

/**
 * Horários, entrega e status da loja. Começa com o padrão do código e é
 * atualizado quando as configurações do Supabase chegam.
 */
export const useSettingsStore = create<SettingsState>()((set) => ({
  settings: defaultStoreSettings,
  setSettings: (settings) => set({ settings }),
}));
