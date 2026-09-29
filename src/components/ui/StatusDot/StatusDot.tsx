import { cn } from '../../../utils/cn';

export function StatusDot({ isOpen }: { isOpen: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'inline-block size-[9px] flex-none rounded-full',
        isOpen ? 'animate-status-pulse bg-status-open' : 'bg-status-closed',
      )}
    />
  );
}
