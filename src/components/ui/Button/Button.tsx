import type { AnchorHTMLAttributes, ButtonHTMLAttributes } from 'react';
import { cn } from '../../../utils/cn';
import { buttonClasses, type ButtonStyleProps } from './buttonStyles';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & ButtonStyleProps;

export function Button({ variant, size, shape, fullWidth, className, type = 'button', ...props }: ButtonProps) {
  return (
    <button type={type} className={cn(buttonClasses({ variant, size, shape, fullWidth }), className)} {...props} />
  );
}

type ButtonLinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & ButtonStyleProps & { external?: boolean };

export function ButtonLink({ variant, size, shape, fullWidth, external, className, ...props }: ButtonLinkProps) {
  const externalProps = external ? { target: '_blank', rel: 'noopener noreferrer' } : {};
  return (
    <a
      className={cn(buttonClasses({ variant, size, shape, fullWidth }), className)}
      {...externalProps}
      {...props}
    />
  );
}
