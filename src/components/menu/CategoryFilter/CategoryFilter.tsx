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

/** Abas de categoria com rolagem horizontal e navegação pelas setas do teclado. */
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
      className="scrollbar-none mx-[calc(-1*clamp(16px,4vw,40px))] mt-7 flex snap-x snap-mandatory gap-2.5 overflow-x-auto px-gutter pt-1 pb-2"
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
              'flex h-12 flex-none snap-start items-center gap-2 rounded-full border-[1.5px] px-5 text-[15px] font-bold transition-[background-color,color,border-color,scale] duration-250 active:scale-96',
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
