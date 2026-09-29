import { useCallback, useSyncExternalStore } from 'react';

/** Mesmos pontos de quebra do mockup e do Tailwind (md = 768px, lg = 1024px). */
export const MEDIA_TABLET_UP = '(min-width: 768px)';

export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const media = window.matchMedia(query);
      media.addEventListener('change', onChange);
      return () => media.removeEventListener('change', onChange);
    },
    [query],
  );

  return useSyncExternalStore(subscribe, () => window.matchMedia(query).matches);
}
