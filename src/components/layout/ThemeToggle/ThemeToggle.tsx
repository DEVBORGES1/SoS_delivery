import { Moon, Sun } from 'lucide-react';
import type { MouseEvent } from 'react';
import { switchTheme, useTheme } from '../../../theme/theme';
import { cn } from '../../../utils/cn';

const VARIANTS = {
  /** Cabeçalho do site e do painel. */
  default: 'border-line text-muted hover:border-accent hover:text-ink',
  /** Barra lateral escura do painel. */
  sidebar: 'border-[rgba(244,239,231,.18)] text-[#bfb2a1] hover:border-[#e0301f] hover:text-white',
};

/** Botão redondo de tema claro/escuro (mesmo comportamento do portfólio). */
export function ThemeToggle({ className, variant = 'default' }: { className?: string; variant?: keyof typeof VARIANTS }) {
  const isDark = useTheme() === 'dark';

  const toggle = (event: MouseEvent<HTMLButtonElement>) => {
    const { left, top, width, height } = event.currentTarget.getBoundingClientRect();
    switchTheme(isDark ? 'light' : 'dark', { x: left + width / 2, y: top + height / 2 });
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isDark ? 'Mudar para o tema claro' : 'Mudar para o tema escuro'}
      title={isDark ? 'Tema claro' : 'Tema escuro'}
      className={cn(
        'grid size-11 flex-none place-items-center rounded-full border transition-[color,border-color,rotate] duration-300 hover:rotate-15',
        VARIANTS[variant],
        className,
      )}
    >
      {isDark ? <Sun size={18} aria-hidden="true" /> : <Moon size={18} aria-hidden="true" />}
    </button>
  );
}
