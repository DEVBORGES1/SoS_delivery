import { cn } from '../../../utils/cn';

interface ImagePlaceholderProps {
  label: string;
  className?: string;
}

/** Espaço reservado listrado do mockup, usado enquanto não há foto real. */
export function ImagePlaceholder({ label, className }: ImagePlaceholderProps) {
  return (
    <div
      role="img"
      aria-label={label}
      className={cn('bg-stripes grid size-full place-items-center p-4 text-center font-mono text-xs text-muted', className)}
    >
      <span aria-hidden="true">{label}</span>
    </div>
  );
}
