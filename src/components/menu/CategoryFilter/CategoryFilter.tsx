import { useRef, type KeyboardEvent } from 'react';
import type { Category } from '../../../types/product';
import { cn } from '../../../utils/cn';
import { categoryTabId } from './categoryTabId';

interface CategoryOption extends Category {
  productCount: number;
}

interface CategoryFilterProps {
  categories: CategoryOption[];
  activeId: string;
  onChange: (categoryId: string) => void;
  panelId: string;
}

/**
 * Abas de categoria. Quebram linha em vez de rolar para o lado, para que todas
 * fiquem à vista no celular. Setas do teclado trocam de aba.
 */
export function CategoryFilter({ categories, activeId, onChange, panelId }: CategoryFilterProps) {
  const listRef = useRef<HTMLDivElement>(null);

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const step = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0;
    if (!step) return;
    event.preventDefault();
    const currentIndex = categories.findIndex((category) => category.id === activeId);
    const next = categories[(currentIndex + step + categories.length) % categories.length];
    onChange(next.id);
    listRef.current?.querySelector<HTMLButtonElement>(`#${categoryTabId(next.id)}`)?.focus();
  };

  return (
    <div
      ref={listRef}
      role="tablist"
      aria-label="Categorias"
      onKeyDown={handleKeyDown}
      className="mt-7 flex flex-wrap gap-2 pt-1 sm:gap-2.5"
    >
      {categories.map((category) => {
        const isActive = category.id === activeId;
        return (
          <button
            key={category.id}
            id={categoryTabId(category.id)}
            type="button"
            role="tab"
            aria-selected={isActive}
            aria-controls={panelId}
            tabIndex={isActive ? 0 : -1}
            onClick={() => onChange(category.id)}
            className={cn(
              'flex h-11 flex-none items-center gap-2 rounded-full border-[1.5px] px-4 text-sm font-bold sm:h-12 sm:px-5 sm:text-[15px] transition-[background-color,color,border-color,scale] duration-250 active:scale-96',
              isActive ? 'border-accent bg-accent text-accent-ink' : 'border-line text-ink',
            )}
          >
            {category.name}
            <span className="text-xs font-extrabold opacity-65">{category.productCount}</span>
          </button>
        );
      })}
    </div>
  );
}
