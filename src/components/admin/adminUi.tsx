import { X } from 'lucide-react';
import { useRef, type InputHTMLAttributes, type ReactNode } from 'react';
import { useDialog } from '../../hooks/useDialog';
import { cn } from '../../utils/cn';

/* Cores do mockup do painel (tons mais neutros que os do site). */
export const CARD = 'rounded-[18px] border border-[#e4dccf] bg-white';
export const CARD_PAD = 'p-[clamp(18px,3vw,28px)]';
export const MUTED = 'text-[#6a5c4d]';
export const LABEL = 'text-sm font-bold';
export const INPUT =
  'h-[50px] w-full rounded-[10px] border-[1.5px] border-[#e4dccf] bg-white px-3.5 text-base text-[#1c1611] outline-none placeholder:text-[#9c8f80] focus:border-[#d3301f] focus:shadow-[0_0_0_4px_rgba(211,48,31,.12)]';
export const BTN_PRIMARY =
  'inline-flex h-12 flex-none cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-[#d3301f] px-5 text-sm font-extrabold tracking-[.04em] text-white hover:brightness-[1.08] disabled:cursor-not-allowed disabled:opacity-60';
export const BTN_OUTLINE =
  'inline-flex h-11 flex-none cursor-pointer items-center justify-center gap-1.5 rounded-[10px] border-[1.5px] border-[#e4dccf] bg-white px-4 text-sm font-bold text-[#1c1611] hover:border-[#1c1611] disabled:cursor-not-allowed disabled:opacity-50';
export const EYEBROW = 'text-xs font-extrabold tracking-[.12em] text-[#6a5c4d]';

interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  disabled?: boolean;
}

/** Interruptor verde/bege do mockup. `label` é o nome acessível. */
export function Switch({ checked, onChange, label, disabled }: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        'flex h-[30px] w-[50px] flex-none cursor-pointer rounded-full p-[3px] transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-60',
        checked ? 'bg-[#178a45]' : 'bg-[#cfc4b4]',
      )}
    >
      <span
        className={cn(
          'size-6 rounded-full bg-white shadow-[0_1px_3px_rgba(0,0,0,.3)] transition-transform duration-200',
          checked && 'translate-x-5',
        )}
      />
    </button>
  );
}

interface ChipOption<T extends string> {
  id: T;
  label: string;
  count?: number;
}

interface ChipsProps<T extends string> {
  options: ChipOption<T>[];
  value: T;
  onChange: (value: T) => void;
  ariaLabel: string;
}

/** Filtros em pílula (categorias, situação dos pedidos). */
export function Chips<T extends string>({ options, value, onChange, ariaLabel }: ChipsProps<T>) {
  return (
    <div role="tablist" aria-label={ariaLabel} className="flex gap-2 overflow-x-auto pb-0.5 [scrollbar-width:none]">
      {options.map((option) => {
        const on = option.id === value;
        return (
          <button
            key={option.id}
            type="button"
            role="tab"
            aria-selected={on}
            onClick={() => onChange(option.id)}
            className={cn(
              'h-10 flex-none cursor-pointer rounded-full border-[1.5px] px-4 text-sm font-bold',
              on ? 'border-[#1c1611] bg-[#1c1611] text-white' : 'border-[#e4dccf] bg-white text-[#1c1611]',
            )}
          >
            {option.label}
            {option.count !== undefined && <span className="ml-1 text-xs opacity-60">{option.count}</span>}
          </button>
        );
      })}
    </div>
  );
}

interface SegmentedProps<T extends string> {
  options: { id: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  ariaLabel: string;
  className?: string;
}

/** Controle segmentado (status da loja, tipo de desconto). */
export function Segmented<T extends string>({ options, value, onChange, ariaLabel, className }: SegmentedProps<T>) {
  return (
    <div role="radiogroup" aria-label={ariaLabel} className={cn('flex gap-1 rounded-xl bg-[#f4efe7] p-1', className)}>
      {options.map((option) => {
        const on = option.id === value;
        return (
          <button
            key={option.id}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => onChange(option.id)}
            className={cn(
              'h-11 flex-1 cursor-pointer rounded-[9px] px-[18px] text-sm font-bold whitespace-nowrap text-[#1c1611] transition-colors duration-200',
              on ? 'bg-white shadow-[0_1px_3px_rgba(0,0,0,.12)]' : 'bg-transparent',
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

interface FieldProps {
  id: string;
  label: ReactNode;
  hint?: ReactNode;
  error?: string;
  className?: string;
  children: ReactNode;
}

export function Field({ id, label, hint, error, className, children }: FieldProps) {
  return (
    <div className={cn('flex min-w-0 flex-col gap-1.5', className)}>
      <label htmlFor={id} className={LABEL}>
        {label}
      </label>
      {children}
      {error ? (
        <span className="text-[13px] font-semibold text-[#b3261e]">{error}</span>
      ) : (
        hint && <span className={cn('text-[12.5px]', MUTED)}>{hint}</span>
      )}
    </div>
  );
}

interface PrefixedInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'prefix'> {
  prefix?: string;
  suffix?: string;
  invalid?: boolean;
  compact?: boolean;
}

/** Campo com "R$" (ou "%") dentro da borda. */
export function PrefixedInput({ prefix, suffix, invalid, compact, className, ...props }: PrefixedInputProps) {
  return (
    <div
      className={cn(
        'flex items-center rounded-[10px] border-[1.5px] bg-white pl-3.5 focus-within:border-[#d3301f]',
        compact ? 'h-11 pl-3' : 'h-[50px]',
        invalid ? 'border-[#b3261e]' : 'border-[#e4dccf]',
        className,
      )}
    >
      {prefix && <span className={cn('text-sm font-bold', MUTED)}>{prefix}</span>}
      <input
        className="h-full w-full min-w-0 border-0 bg-transparent pr-3 pl-1.5 text-base font-extrabold text-[#1c1611] tabular-nums outline-none"
        {...props}
      />
      {suffix && <span className={cn('pr-3.5 text-sm font-bold', MUTED)}>{suffix}</span>}
    </div>
  );
}

interface DrawerProps {
  title: string;
  onClose: () => void;
  footer: ReactNode;
  /** Largura no desktop (no celular ocupa a tela toda). */
  width: 'wide' | 'narrow';
  children: ReactNode;
}

/** Gaveta lateral de edição: fecha com Esc ou clicando fora e prende o foco. */
export function Drawer({ title, onClose, footer, width, children }: DrawerProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  useDialog(true, onClose, panelRef);

  return (
    <div className="fixed inset-0 z-60">
      <div aria-hidden="true" onClick={onClose} className="absolute inset-0 bg-[rgba(28,22,17,.45)]" />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="drawer-title"
        tabIndex={-1}
        className={cn(
          'absolute inset-y-0 right-0 flex w-full flex-col bg-white text-[#1c1611] shadow-[-20px_0_60px_-20px_rgba(0,0,0,.35)] outline-none',
          width === 'wide' ? 'min-[960px]:w-[760px]' : 'min-[640px]:w-[520px]',
        )}
      >
        <div className="flex items-center justify-between border-b border-[#efe8dd] px-5 py-4">
          <h2 id="drawer-title" className="m-0 font-display text-[26px] font-normal uppercase">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="grid size-11 cursor-pointer place-items-center rounded-full bg-[#f4efe7] text-[#1c1611]"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>
        <div className="flex-1 overflow-auto p-5">{children}</div>
        <div className="flex items-center gap-2.5 border-t border-[#efe8dd] px-5 py-3.5">{footer}</div>
      </div>
    </div>
  );
}

interface ConfirmButtonProps {
  label: string;
  confirmLabel: string;
  confirming: boolean;
  onClick: () => void;
  disabled?: boolean;
  className?: string;
}

/** Botão vermelho que pede um segundo toque para confirmar (excluir, cancelar pedido). */
export function ConfirmButton({ label, confirmLabel, confirming, onClick, disabled, className }: ConfirmButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'h-[50px] cursor-pointer rounded-xl border-[1.5px] border-[#d3301f] px-4 text-sm font-extrabold disabled:cursor-not-allowed disabled:opacity-60',
        confirming ? 'bg-[#d3301f] text-white' : 'bg-white text-[#d3301f]',
        className,
      )}
    >
      {confirming ? confirmLabel : label}
    </button>
  );
}

/** Miniatura quadrada com o fundo listrado quando não há foto. */
export function Thumb({ src, className, dimmed }: { src?: string; className?: string; dimmed?: boolean }) {
  return (
    <div
      className={cn(
        'flex-none overflow-hidden rounded-xl bg-[#eee6da] bg-[repeating-linear-gradient(135deg,rgba(28,22,17,.05)_0_8px,transparent_8px_16px)]',
        className,
      )}
    >
      {src && <img src={src} alt="" loading="lazy" className={cn('size-full object-cover', dimmed && 'grayscale')} />}
    </div>
  );
}
