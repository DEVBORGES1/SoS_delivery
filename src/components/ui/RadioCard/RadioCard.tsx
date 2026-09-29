import { cn } from '../../../utils/cn';

interface RadioCardProps<T extends string> {
  name: string;
  value: T;
  checked: boolean;
  onChange: (value: T) => void;
  title: string;
  description: string;
  className?: string;
}

/** Opção de rádio em formato de card (tipo de pedido e pagamento no checkout). */
export function RadioCard<T extends string>({
  name,
  value,
  checked,
  onChange,
  title,
  description,
  className,
}: RadioCardProps<T>) {
  return (
    <label
      className={cn(
        'group flex cursor-pointer gap-3 rounded-control border-2 border-line text-left transition-[border-color,background-color] duration-200',
        'has-checked:border-accent has-checked:bg-surface-alt',
        'has-focus-visible:outline-[3px] has-focus-visible:outline-offset-2 has-focus-visible:outline-mustard has-focus-visible:outline-solid',
        className,
      )}
    >
      <input
        type="radio"
        name={name}
        value={value}
        checked={checked}
        onChange={() => onChange(value)}
        className="sr-only"
      />
      <span
        aria-hidden="true"
        className="grid size-[22px] flex-none place-items-center rounded-full border-2 border-line group-has-checked:border-accent"
      >
        <span className="size-2.5 scale-0 rounded-full bg-accent transition-transform duration-200 group-has-checked:scale-100" />
      </span>
      <span className="flex flex-col gap-0.5">
        <span className="text-base font-extrabold">{title}</span>
        <span className="text-[13px] text-muted">{description}</span>
      </span>
    </label>
  );
}
