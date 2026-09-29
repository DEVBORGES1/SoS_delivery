import type { ReactNode } from 'react';

interface FormSectionProps {
  title: string;
  children: ReactNode;
}

/** Bloco numerado do checkout ("1 · Seus dados", "2 · Como quer receber?"…). */
export function FormSection({ title, children }: FormSectionProps) {
  return (
    <fieldset className="m-0 min-w-0 rounded-[20px] border border-line bg-surface p-[clamp(20px,3vw,28px)]">
      <legend className="-ml-2 px-2 font-display text-[22px] uppercase">{title}</legend>
      {children}
    </fieldset>
  );
}

/** Grade de campos: uma coluna no mobile, duas a partir de 768px. */
export const FIELD_GRID = 'grid grid-cols-1 gap-3.5 md:grid-cols-2';
