import { Minus, Plus, X } from 'lucide-react';
import { cn } from '../../../utils/cn';

type StepperSize = 'sm' | 'md';

interface QuantityStepperProps {
  value: number;
  onIncrement: () => void;
  onDecrement: () => void;
  incrementLabel: string;
  decrementLabel: string;
  size?: StepperSize;
  /** Mostra "×" no botão de diminuir (quando a ação remove o item). */
  decrementRemoves?: boolean;
  /** Destaca o botão "+" com a cor de destaque (usado no modal de produto). */
  highlightIncrement?: boolean;
}

const SIZES: Record<StepperSize, { wrapper: string; button: string; value: string; icon: number }> = {
  sm: { wrapper: 'gap-1 p-[3px]', button: 'size-[38px]', value: 'min-w-7', icon: 18 },
  md: { wrapper: 'gap-1.5 p-1', button: 'size-11', value: 'min-w-8 text-lg', icon: 20 },
};

export function QuantityStepper({
  value,
  onIncrement,
  onDecrement,
  incrementLabel,
  decrementLabel,
  size = 'md',
  decrementRemoves = false,
  highlightIncrement = false,
}: QuantityStepperProps) {
  const styles = SIZES[size];
  const buttonBase = cn('grid place-items-center rounded-full transition-transform active:scale-90', styles.button);
  const DecrementIcon = decrementRemoves ? X : Minus;

  return (
    <div className={cn('flex items-center rounded-full bg-surface-alt', styles.wrapper)}>
      <button type="button" onClick={onDecrement} aria-label={decrementLabel} className={cn(buttonBase, 'bg-surface text-ink')}>
        <DecrementIcon size={styles.icon} strokeWidth={2.5} aria-hidden="true" />
      </button>
      <span aria-live="polite" className={cn('text-center font-extrabold tabular-nums', styles.value)}>
        {value}
      </span>
      <button
        type="button"
        onClick={onIncrement}
        aria-label={incrementLabel}
        className={cn(buttonBase, highlightIncrement ? 'bg-accent text-accent-ink' : 'bg-surface text-ink')}
      >
        <Plus size={styles.icon} strokeWidth={2.5} aria-hidden="true" />
      </button>
    </div>
  );
}
