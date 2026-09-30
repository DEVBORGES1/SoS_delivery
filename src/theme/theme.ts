import { useSyncExternalStore } from 'react';
import { flushSync } from 'react-dom';

export type Theme = 'light' | 'dark';

const STORAGE_KEY = 'theme';
const CHANGE_EVENT = 'themechange';
/** Cor da barra do navegador no celular (meta theme-color) em cada tema. */
const THEME_COLOR: Record<Theme, string> = { light: '#f5eee2', dark: '#0c0a09' };

export function getTheme(): Theme {
  return document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';
}

function savedTheme(): Theme | null {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    return value === 'light' || value === 'dark' ? value : null;
  } catch {
    return null;
  }
}

function applyTheme(theme: Theme, persist: boolean) {
  const root = document.documentElement;
  if (theme === 'dark') root.dataset.theme = 'dark';
  else delete root.dataset.theme;
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', THEME_COLOR[theme]);
  if (persist) {
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // Armazenamento bloqueado: o tema vale só para esta visita.
    }
  }
  // Renderiza na hora (dentro da transição) para o ícone do botão já trocar na animação.
  flushSync(() => window.dispatchEvent(new Event(CHANGE_EVENT)));
}

/**
 * Troca o tema com a animação do portfólio: o tema novo surge num círculo que
 * cresce a partir de `origin` (centro do botão). Sem suporte à View Transitions
 * API ou com "reduzir movimento" ativo, troca sem animação.
 */
export function switchTheme(theme: Theme, origin?: { x: number; y: number }) {
  const animate =
    typeof document.startViewTransition === 'function' &&
    !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!animate) return applyTheme(theme, true);

  if (origin) {
    document.documentElement.style.setProperty('--reveal-x', `${origin.x}px`);
    document.documentElement.style.setProperty('--reveal-y', `${origin.y}px`);
  }
  document.startViewTransition(() => applyTheme(theme, true));
}

function subscribe(onChange: () => void) {
  window.addEventListener(CHANGE_EVENT, onChange);
  // Sem escolha salva, acompanha o tema do sistema (ex.: celular no modo escuro à noite).
  const media = window.matchMedia('(prefers-color-scheme: dark)');
  const onSystemChange = () => {
    if (!savedTheme()) applyTheme(media.matches ? 'dark' : 'light', false);
  };
  media.addEventListener('change', onSystemChange);
  return () => {
    window.removeEventListener(CHANGE_EVENT, onChange);
    media.removeEventListener('change', onSystemChange);
  };
}

export function useTheme(): Theme {
  return useSyncExternalStore(subscribe, getTheme, () => 'light');
}
