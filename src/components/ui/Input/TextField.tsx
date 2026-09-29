import type { InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from 'react';
import { cn } from '../../../utils/cn';

const CONTROL =
  'w-full rounded-field border-[1.5px] bg-field text-base text-ink outline-none transition-[border-color,box-shadow] duration-200 focus:border-accent focus:shadow-focus';

interface CommonFieldProps {
  id: string;
  label: string;
  optional?: boolean;
  error?: string;
  /** Rótulo maior e mais pesado (usado no modal de produto). */
  emphasizedLabel?: boolean;
  className?: string;
}

function FieldShell({
  id,
  label,
  optional,
  error,
  emphasizedLabel,
  className,
  children,
}: CommonFieldProps & { children: ReactNode }) {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <label htmlFor={id} className={emphasizedLabel ? 'text-base font-extrabold' : 'text-sm font-bold'}>
        {label}
        {optional && <span className="font-medium text-muted"> (opcional)</span>}
      </label>
      {children}
      {error && (
        <span id={`${id}-error`} className="text-[13px] font-semibold text-danger">
          {error}
        </span>
      )}
    </div>
  );
}

function controlProps(id: string, error?: string) {
  return {
    id,
    'aria-invalid': error ? true : undefined,
    'aria-describedby': error ? `${id}-error` : undefined,
  };
}

type TextFieldProps = CommonFieldProps & Omit<InputHTMLAttributes<HTMLInputElement>, 'id' | 'className'>;

export function TextField({ id, label, optional, error, emphasizedLabel, className, ...inputProps }: TextFieldProps) {
  return (
    <FieldShell {...{ id, label, optional, error, emphasizedLabel, className }}>
      <input
        {...controlProps(id, error)}
        className={cn(CONTROL, 'h-[54px] px-4', error ? 'border-danger-line' : 'border-line')}
        {...inputProps}
      />
    </FieldShell>
  );
}

type TextAreaFieldProps = CommonFieldProps &
  Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'id' | 'className'> & { resizable?: boolean };

export function TextAreaField({
  id,
  label,
  optional,
  error,
  emphasizedLabel,
  className,
  resizable = false,
  ...textareaProps
}: TextAreaFieldProps) {
  return (
    <FieldShell {...{ id, label, optional, error, emphasizedLabel, className }}>
      <textarea
        {...controlProps(id, error)}
        className={cn(
          CONTROL,
          'px-4 py-3.5 leading-[1.45]',
          resizable ? 'resize-y' : 'resize-none',
          error ? 'border-danger-line' : 'border-line',
        )}
        {...textareaProps}
      />
    </FieldShell>
  );
}
