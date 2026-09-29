import { useMemo } from 'react';
import { useSettingsStore } from '../stores/settingsStore';
import type { OpeningHours, StoreSettings } from '../types/store';
import { groupWeeklyHours } from '../utils/storeHours';

/** Configurações atuais da loja, com os horários já agrupados para exibição. */
export function useStoreSettings(): StoreSettings & { openingHours: OpeningHours[] } {
  const settings = useSettingsStore((state) => state.settings);
  return useMemo(() => ({ ...settings, openingHours: groupWeeklyHours(settings.weeklyHours) }), [settings]);
}
