import type { ReactNode } from 'react';
import { cn } from '../../../utils/cn';

type BadgeTone = 'mustard' | 'accent';
type BadgeSize = 'sm' | 'md';

const TONES: Record<BadgeTone, string> = {
  mustard: 'bg-mustard text-mustard-ink uppercase',
  accent: 'bg-accent text-accent-ink',
};

const SIZES: Record<BadgeSize, string> = {
  sm: 'rounded-[5px] px-2 py-[3px] text-[11px]',
  md: 'rounded-md px-2.5 py-[5px] text-xs',
};

interface BadgeProps {
  tone?: BadgeTone;
  size?: BadgeSize;
  className?: string;
  children: ReactNode;
}

export function Badge({ tone = 'mustard', size = 'md', className, children }: BadgeProps) {
  return (
    <span className={cn('font-extrabold tracking-[.04em]', TONES[tone], SIZES[size], className)}>{children}</span>
  );
}
