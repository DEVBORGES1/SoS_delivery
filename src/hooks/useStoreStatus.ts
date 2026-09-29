import { useEffect, useMemo, useState } from 'react';
import { storeConfig } from '../data/storeConfig';
import type { StoreStatus } from '../types/store';
import { getStoreStatus, getStoreStatusLabels, type StoreStatusLabels } from '../utils/storeHours';

const REFRESH_INTERVAL_MS = 60_000;

function readStatus(): StoreStatus {
  return getStoreStatus(storeConfig.openingHours, storeConfig.statusOverride);
}

/** Status aberto/fechado (reavaliado a cada minuto) e os textos exibidos na interface. */
export function useStoreStatus(): StoreStatus & { labels: StoreStatusLabels } {
  const [status, setStatus] = useState(readStatus);

  useEffect(() => {
    const timer = setInterval(() => setStatus(readStatus()), REFRESH_INTERVAL_MS);
    return () => clearInterval(timer);
  }, []);

  return useMemo(() => ({ ...status, labels: getStoreStatusLabels(status, storeConfig.deliveryEta) }), [status]);
}
