import { Moon, Sun } from 'lucide-react';
import type { MouseEvent } from 'react';
import { switchTheme, useTheme } from '../../../theme/theme';
import { cn } from '../../../utils/cn';

/** Botão redondo de tema claro/escuro (mesmo comportamento do portfólio). */
export function ThemeToggle({ className }: { className?: string }) {
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
        'grid size-11 flex-none place-items-center rounded-full border border-line text-muted transition-[color,border-color,rotate] duration-300 hover:rotate-15 hover:border-accent hover:text-ink',
        className,
      )}
    >
      {isDark ? <Sun size={18} aria-hidden="true" /> : <Moon size={18} aria-hidden="true" />}
    </button>
  );
}
