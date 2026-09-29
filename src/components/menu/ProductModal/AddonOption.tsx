import { Check } from 'lucide-react';
import type { Addon } from '../../../types/product';
import { formatCurrency } from '../../../utils/currency';

interface AddonOptionProps {
  addon: Addon;
  checked: boolean;
  onToggle: (addonId: string) => void;
}

export function AddonOption({ addon, checked, onToggle }: AddonOptionProps) {
  return (
    <label className="group flex min-h-14 cursor-pointer items-center gap-3.5 rounded-control border-[1.5px] border-line px-4 transition-[border-color,background-color] duration-200 has-checked:border-accent has-checked:bg-surface-alt has-focus-visible:outline-[3px] has-focus-visible:outline-offset-2 has-focus-visible:outline-mustard has-focus-visible:outline-solid">
      <input type="checkbox" checked={checked} onChange={() => onToggle(addon.id)} className="sr-only" />
      <span
        aria-hidden="true"
        className="grid size-6 flex-none place-items-center rounded-[7px] border-2 border-line text-accent-ink transition-colors duration-200 group-has-checked:border-accent group-has-checked:bg-accent"
      >
        <Check size={14} strokeWidth={3.5} className="opacity-0 group-has-checked:opacity-100" />
      </span>
      <span className="flex-1 text-[15.5px] font-bold">{addon.name}</span>
      <span className="text-[15px] font-bold text-muted">+ {formatCurrency(addon.price)}</span>
    </label>
  );
}
