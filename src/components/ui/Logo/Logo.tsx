import { cn } from '../../../utils/cn';

/** Selo vermelho "S.O.S" inclinado da marca. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'block -rotate-4 rounded-md bg-accent px-[9px] pt-[5px] pb-1 font-display text-[21px] leading-none tracking-[.03em] text-white',
        className,
      )}
    >
      S.O.S
    </span>
  );
}
