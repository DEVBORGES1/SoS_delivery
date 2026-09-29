import { useEffect, useMemo, useState } from 'react';
import type { StoreStatus } from '../types/store';
import { getStoreStatus, getStoreStatusLabels, type StoreStatusLabels } from '../utils/storeHours';
import { useStoreSettings } from './useStoreSettings';

const REFRESH_INTERVAL_MS = 60_000;

/** Status aberto/fechado (reavaliado a cada minuto) e os textos exibidos na interface. */
export function useStoreStatus(): StoreStatus & { labels: StoreStatusLabels } {
  const { openingHours, statusOverride, deliveryEta } = useStoreSettings();
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), REFRESH_INTERVAL_MS);
    return () => clearInterval(timer);
  }, []);

  return useMemo(() => {
    const status = getStoreStatus(openingHours, statusOverride, now);
    return { ...status, labels: getStoreStatusLabels(status, deliveryEta) };
  }, [openingHours, statusOverride, deliveryEta, now]);
}
