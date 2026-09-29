import { useRef, type ReactNode } from 'react';
import { useDialog } from '../../../hooks/useDialog';
import { cn } from '../../../utils/cn';

type DialogVariant = 'modal' | 'drawer';

interface DialogProps {
  open: boolean;
  onClose: () => void;
  variant: DialogVariant;
  ariaLabel?: string;
  ariaLabelledBy?: string;
  className?: string;
  children: ReactNode;
}

/** Ao fechar, o painel só fica invisível depois da animação de saída (400ms). */
const TRANSITION_OPEN =
  'visible [transition:translate_400ms_var(--ease-smooth),scale_400ms_var(--ease-smooth),opacity_400ms_var(--ease-smooth),visibility_0s]';
const TRANSITION_CLOSED =
  'invisible [transition:translate_400ms_var(--ease-smooth),scale_400ms_var(--ease-smooth),opacity_400ms_var(--ease-smooth),visibility_0s_400ms]';

/**
 * Mobile: ambos viram "bottom sheet".
 * Modal no desktop: painel central que sobe levemente.
 * Drawer no desktop: painel lateral que entra pela direita.
 */
const LAYOUT: Record<DialogVariant, { wrapper: string; panel: string; open: string; closed: string }> = {
  modal: {
    wrapper: 'z-80 flex items-end justify-center md:items-center md:p-6',
    panel:
      'relative w-full max-h-[94vh] rounded-t-sheet md:w-[min(940px,100%)] md:max-h-[min(680px,calc(100vh-48px))] md:rounded-[26px] shadow-dialog',
    open: 'translate-y-0 opacity-100 md:scale-100',
    closed: 'translate-y-full opacity-0 md:translate-y-6 md:scale-[.97]',
  },
  drawer: {
    wrapper: 'z-60',
    panel:
      'absolute bottom-0 right-0 h-[88vh] w-full rounded-t-sheet md:top-0 md:h-full md:w-[440px] md:rounded-none shadow-drawer',
    open: 'translate-x-0 translate-y-0',
    closed: 'translate-y-full md:translate-x-full md:translate-y-0',
  },
};

export function Dialog({ open, onClose, variant, ariaLabel, ariaLabelledBy, className, children }: DialogProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  useDialog(open, onClose, panelRef);
  const layout = LAYOUT[variant];

  return (
    <div className={cn('fixed inset-0', layout.wrapper, !open && 'pointer-events-none')} inert={!open}>
      <div
        aria-hidden="true"
        onClick={onClose}
        className={cn(
          'absolute inset-0 bg-overlay transition-opacity duration-300',
          open ? 'opacity-100' : 'opacity-0',
        )}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledBy}
        tabIndex={-1}
        className={cn(
          'flex bg-surface text-ink outline-none',
          layout.panel,
          open ? cn(layout.open, TRANSITION_OPEN) : cn(layout.closed, TRANSITION_CLOSED),
          className,
        )}
      >
        {children}
      </div>
    </div>
  );
}
