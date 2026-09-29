import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from 'react';
import { cn } from '../../utils/cn';

export const ADMIN_CARD = 'rounded-sheet border border-line bg-surface p-[clamp(18px,3vw,28px)]';
export const ADMIN_INPUT =
  'h-11 w-full rounded-field border-[1.5px] border-line bg-field px-3 text-base text-ink outline-none transition-[border-color,box-shadow] duration-200 focus:border-accent focus:shadow-focus disabled:opacity-50';

export function AdminSectionTitle({ children, description }: { children: ReactNode; description?: ReactNode }) {
  return (
    <div className="mb-5">
      <h2 className="font-display text-[clamp(26px,3.5vw,34px)] leading-none uppercase">{children}</h2>
      {description && <p className="mt-2 text-sm text-muted">{description}</p>}
    </div>
  );
}

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: ReactNode;
  disabled?: boolean;
  className?: string;
}

/** Interruptor liga/desliga acessível (checkbox estilizado). */
export function Toggle({ checked, onChange, label, disabled, className }: ToggleProps) {
  return (
    <label className={cn('inline-flex cursor-pointer items-center gap-2.5 text-[15px] font-bold', className)}>
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
        className="peer sr-only"
      />
      <span
        aria-hidden="true"
        className={cn(
          'relative h-6 w-11 flex-none rounded-full transition-colors duration-200',
          'peer-focus-visible:outline-[3px] peer-focus-visible:outline-offset-2 peer-focus-visible:outline-mustard peer-focus-visible:outline-solid',
          'after:absolute after:top-0.5 after:left-0.5 after:size-5 after:rounded-full after:bg-white after:shadow after:transition-transform after:duration-200',
          checked ? 'bg-status-open after:translate-x-5' : 'bg-disabled/40',
        )}
      />
      {label}
    </label>
  );
}

interface FieldProps {
  id: string;
  label: string;
  hint?: string;
  className?: string;
}

export function AdminInput({ id, label, hint, className, ...props }: FieldProps & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <label htmlFor={id} className="text-sm font-bold">
        {label}
      </label>
      <input id={id} className={ADMIN_INPUT} {...props} />
      {hint && <span className="text-xs text-muted">{hint}</span>}
    </div>
  );
}

export function AdminSelect({
  id,
  label,
  hint,
  className,
  children,
  ...props
}: FieldProps & SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <label htmlFor={id} className="text-sm font-bold">
        {label}
      </label>
      <select id={id} className={ADMIN_INPUT} {...props}>
        {children}
      </select>
      {hint && <span className="text-xs text-muted">{hint}</span>}
    </div>
  );
}

export type Feedback = { tone: 'success' | 'error'; message: string } | null;

export function FeedbackMessage({ feedback }: { feedback: Feedback }) {
  if (!feedback) return null;
  return (
    <p
      role={feedback.tone === 'error' ? 'alert' : 'status'}
      className={cn(
        'rounded-field px-3.5 py-2.5 text-sm font-bold',
        feedback.tone === 'error' ? 'bg-status-closed/14 text-danger' : 'bg-status-open/14 text-success-ink',
      )}
    >
      {feedback.message}
    </p>
  );
}
