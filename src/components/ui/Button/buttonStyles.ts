import { cn } from '../../../utils/cn';

type ButtonVariant = 'primary' | 'cta3d' | 'outline' | 'outlineInk' | 'whatsapp' | 'ghost';
type ButtonSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
type ButtonShape = 'pill' | 'rounded' | 'soft';

export interface ButtonStyleProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  shape?: ButtonShape;
  fullWidth?: boolean;
}

const BASE =
  'inline-flex items-center justify-center gap-2 font-extrabold tracking-[.06em] transition-[transform,filter,background-color,color,border-color,box-shadow] duration-200 disabled:cursor-not-allowed';

const VARIANTS: Record<ButtonVariant, string> = {
  primary: 'bg-accent text-accent-ink hover:brightness-[1.08] active:scale-[.97]',
  cta3d:
    'bg-accent text-accent-ink tracking-[.08em] shadow-cta-3d duration-[120ms] hover:-translate-y-0.5 hover:shadow-cta-3d-hover active:translate-y-1 active:shadow-cta-3d-active',
  outline: 'border-[1.5px] border-line font-bold tracking-normal hover:bg-line',
  outlineInk: 'border-2 border-ink text-ink tracking-[.08em] hover:bg-ink hover:text-bg',
  whatsapp: 'bg-whatsapp text-white shadow-whatsapp hover:brightness-110 active:scale-[.98]',
  ghost: 'font-bold tracking-normal text-muted hover:text-ink',
};

const SIZES: Record<ButtonSize, string> = {
  xs: 'h-[46px] px-[22px] text-sm',
  sm: 'h-12 px-[22px] text-sm',
  md: 'h-[52px] px-6 text-sm',
  lg: 'h-[54px] px-7 text-[15px]',
  xl: 'h-[58px] px-8 text-[15px]',
  '2xl': 'h-[60px] px-3 text-[15px]',
};

const SHAPES: Record<ButtonShape, string> = {
  pill: 'rounded-full',
  rounded: 'rounded-cta',
  soft: 'rounded-control',
};

export function buttonClasses({
  variant = 'primary',
  size = 'lg',
  shape = 'pill',
  fullWidth = false,
}: ButtonStyleProps = {}): string {
  return cn(BASE, VARIANTS[variant], SIZES[size], SHAPES[shape], fullWidth && 'w-full');
}
