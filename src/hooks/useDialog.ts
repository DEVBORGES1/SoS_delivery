import { useEffect, type RefObject } from 'react';

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

let scrollLocks = 0;

function lockBodyScroll() {
  scrollLocks += 1;
  document.body.style.overflow = 'hidden';
}

function unlockBodyScroll() {
  scrollLocks = Math.max(0, scrollLocks - 1);
  if (scrollLocks === 0) document.body.style.overflow = '';
}

function getFocusable(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE));
}

function trapTab(event: KeyboardEvent, container: HTMLElement) {
  const focusable = getFocusable(container);
  if (focusable.length === 0) return;
  const first = focusable[0];
  const last = focusable[focusable.length - 1];

  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}

/**
 * Comportamento acessível de diálogo: fecha com Esc, prende o foco no
 * painel, trava a rolagem da página e devolve o foco ao fechar.
 */
export function useDialog(open: boolean, onClose: () => void, panelRef: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const panel = panelRef.current;
    if (!open || !panel) return;

    const previouslyFocused = document.activeElement as HTMLElement | null;
    lockBodyScroll();
    (getFocusable(panel)[0] ?? panel).focus({ preventScroll: true });

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
      if (event.key === 'Tab') trapTab(event, panel);
    };
    document.addEventListener('keydown', onKeyDown);

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      unlockBodyScroll();
      previouslyFocused?.focus({ preventScroll: true });
    };
  }, [open, onClose, panelRef]);
}
