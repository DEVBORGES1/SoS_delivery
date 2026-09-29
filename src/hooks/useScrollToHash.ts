import { useEffect } from 'react';
import { useLocation } from 'react-router';

/**
 * Rola suavemente até a seção indicada no hash da URL (ex.: "/#cardapio").
 * Depende de `location.key` para funcionar também quando o mesmo link é
 * clicado duas vezes.
 */
export function useScrollToHash() {
  const { hash, key } = useLocation();

  useEffect(() => {
    if (!hash) return;
    const frame = requestAnimationFrame(() => {
      document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    return () => cancelAnimationFrame(frame);
  }, [hash, key]);
}
