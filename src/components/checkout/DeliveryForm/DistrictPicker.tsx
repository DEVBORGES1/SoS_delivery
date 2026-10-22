import { Check, ChevronDown, Search, X } from 'lucide-react';
import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react';
import { MEDIA_TABLET_UP, useMediaQuery } from '../../../hooks/useMediaQuery';
import type { DeliveryZone } from '../../../types/store';
import { cn } from '../../../utils/cn';
import { formatCurrency } from '../../../utils/currency';
import { findZone } from '../../../utils/delivery';
import { Dialog } from '../../ui/Dialog/Dialog';
import { FieldShell } from '../../ui/Input/TextField';

/** Com poucos bairros a busca só atrapalha. */
const SEARCH_MIN_ZONES = 7;

/** "São Cristóvão" → "sao cristovao": a busca ignora acentos e maiúsculas. */
function normalize(text: string): string {
  return text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim();
}

/** Taxa do bairro: valor normal ou, na promoção, riscado com "GRÁTIS". */
function ZoneFee({ fee, freeDelivery }: { fee: number; freeDelivery: boolean }) {
  if (freeDelivery) {
    return (
      <span className="flex items-baseline gap-1.5 whitespace-nowrap">
        {fee > 0 && <s className="text-[13px] text-muted">{formatCurrency(fee)}</s>}
        <span className="rounded-full bg-whatsapp/12 px-2.5 py-0.5 text-[13px] font-extrabold text-success-ink">
          GRÁTIS
        </span>
      </span>
    );
  }
  return (
    <span className="rounded-full border border-line bg-field px-2.5 py-0.5 text-[13px] font-bold whitespace-nowrap">
      {fee ? formatCurrency(fee) : 'Grátis'}
    </span>
  );
}

interface ZoneListProps {
  zones: DeliveryZone[];
  freeDelivery: boolean;
  selectedId: string | undefined;
  onSelect: (zone: DeliveryZone) => void;
  onClose: () => void;
  /** Foca a busca ao abrir (no celular não, para o teclado não cobrir a lista). */
  autoFocus: boolean;
  listClassName?: string;
}

/** Busca + lista de bairros, usada na caixa (desktop) e na folha de baixo (celular). */
function ZoneList({ zones, freeDelivery, selectedId, onSelect, onClose, autoFocus, listClassName }: ZoneListProps) {
  const listId = useId();
  const [query, setQuery] = useState('');
  const search = normalize(query);
  const visible = search ? zones.filter((zone) => normalize(zone.name).includes(search)) : zones;
  const [active, setActive] = useState(() =>
    Math.max(
      0,
      zones.findIndex((zone) => zone.id === selectedId),
    ),
  );
  const activeIndex = Math.min(active, visible.length - 1);
  const optionId = (index: number) => `${listId}-${index}`;
  const showSearch = zones.length >= SEARCH_MIN_ZONES;

  // Mantém a opção ativa (setas do teclado) à vista.
  useEffect(() => {
    if (activeIndex >= 0) document.getElementById(`${listId}-${activeIndex}`)?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex, listId]);

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      const step = event.key === 'ArrowDown' ? 1 : -1;
      setActive(Math.min(visible.length - 1, Math.max(0, activeIndex + step)));
    } else if (event.key === 'Enter' && visible[activeIndex]) {
      event.preventDefault();
      onSelect(visible[activeIndex]);
    } else if (event.key === 'Escape') {
      event.stopPropagation();
      onClose();
    }
  };
  const activeDescendant = activeIndex >= 0 ? optionId(activeIndex) : undefined;

  return (
    <>
      {showSearch && (
        <div className="relative px-3 pt-3 pb-2">
          <Search
            size={18}
            strokeWidth={2.25}
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-7 -translate-y-[calc(50%-2px)] text-muted"
          />
          <input
            type="search"
            role="combobox"
            aria-label="Buscar bairro"
            aria-controls={listId}
            aria-expanded="true"
            aria-autocomplete="list"
            aria-activedescendant={activeDescendant}
            autoFocus={autoFocus}
            autoComplete="off"
            placeholder="Buscar bairro…"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setActive(0);
            }}
            onKeyDown={onKeyDown}
            className="h-12 w-full rounded-field border-[1.5px] border-line bg-field pr-4 pl-11 text-base text-ink outline-none transition-[border-color,box-shadow] duration-200 focus:border-accent focus:shadow-focus"
          />
        </div>
      )}
      <ul
        id={listId}
        role="listbox"
        aria-label="Bairros atendidos"
        tabIndex={showSearch ? -1 : 0}
        autoFocus={autoFocus && !showSearch}
        aria-activedescendant={showSearch ? undefined : activeDescendant}
        onKeyDown={showSearch ? undefined : onKeyDown}
        // O foco fica na busca: tocar num bairro não pode fechar a caixa antes do clique.
        onMouseDown={(event) => event.preventDefault()}
        className={cn(
          'overflow-y-auto overscroll-contain px-2 pb-2 outline-none',
          !showSearch && 'pt-2',
          listClassName,
        )}
      >
        {visible.map((zone, index) => {
          const selected = zone.id === selectedId;
          return (
            <li
              key={zone.id}
              id={optionId(index)}
              role="option"
              aria-selected={selected}
              onClick={() => onSelect(zone)}
              onMouseMove={() => index !== activeIndex && setActive(index)}
              className={cn(
                'flex min-h-[52px] cursor-pointer items-center gap-3 rounded-field px-3 py-2 transition-colors duration-150',
                index === activeIndex && 'bg-surface-alt',
              )}
            >
              <span
                aria-hidden="true"
                className={cn(
                  'grid size-[22px] flex-none place-items-center rounded-full border-2',
                  selected ? 'border-accent bg-accent text-accent-ink' : 'border-line',
                )}
              >
                {selected && <Check size={13} strokeWidth={3.5} />}
              </span>
              <span className={cn('min-w-0 flex-1 text-[15px]', selected ? 'font-extrabold' : 'font-semibold')}>
                {zone.name}
              </span>
              <ZoneFee fee={zone.fee} freeDelivery={freeDelivery} />
            </li>
          );
        })}
        {visible.length === 0 && (
          <li role="presentation" className="px-3 py-6 text-center text-[15px] text-muted">
            Nenhum bairro com esse nome.
            <br />
            <span className="text-sm">Confira a grafia ou escolha a retirada no balcão.</span>
          </li>
        )}
      </ul>
    </>
  );
}

interface DistrictPickerProps {
  id: string;
  label: string;
  zones: DeliveryZone[];
  freeDelivery: boolean;
  value: string;
  error?: string;
  onChange: (district: string) => void;
}

/**
 * Escolha do bairro no checkout. No computador abre uma caixa logo abaixo do
 * campo; no celular, uma folha que sobe de baixo (mesmo visual do modal de produto).
 */
export function DistrictPicker({ id, label, zones, freeDelivery, value, error, onChange }: DistrictPickerProps) {
  const isDesktop = useMediaQuery(MEDIA_TABLET_UP);
  const [open, setOpen] = useState(false);
  /** Cada abertura começa com a busca limpa e o bairro escolhido em destaque. */
  const [session, setSession] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const selected = findZone(zones, value);
  const titleId = `${id}-title`;

  const close = (returnFocus = true) => {
    setOpen(false);
    if (returnFocus) triggerRef.current?.focus({ preventScroll: true });
  };
  const select = (zone: DeliveryZone) => {
    onChange(zone.name);
    close();
  };

  // Caixa do computador: rola a página para ela aparecer inteira.
  useEffect(() => {
    if (open && isDesktop) panelRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [open, isDesktop]);

  // Caixa do computador: fecha ao clicar fora.
  useEffect(() => {
    if (!open || !isDesktop) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [open, isDesktop]);

  const list = (
    <ZoneList
      key={session}
      zones={zones}
      freeDelivery={freeDelivery}
      selectedId={selected?.id}
      onSelect={select}
      onClose={close}
      autoFocus={isDesktop}
      listClassName={isDesktop ? 'max-h-[312px]' : 'min-h-0 flex-1 pb-[calc(12px+env(safe-area-inset-bottom))]'}
    />
  );

  return (
    <FieldShell id={id} label={label} error={error}>
      <div
        ref={rootRef}
        className="relative"
        onBlur={(event) => {
          // Tab para fora da caixa do computador também fecha.
          if (isDesktop && open && !rootRef.current?.contains(event.relatedTarget as Node | null)) setOpen(false);
        }}
      >
        <button
          ref={triggerRef}
          id={id}
          type="button"
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          onClick={() => {
            if (!open) setSession((current) => current + 1);
            setOpen(!open);
          }}
          className={cn(
            'flex h-[54px] w-full cursor-pointer items-center gap-3 rounded-field border-[1.5px] bg-field pr-3.5 pl-4 text-left text-base text-ink outline-none transition-[border-color,box-shadow] duration-200 focus-visible:border-accent focus-visible:shadow-focus',
            error ? 'border-danger-line' : open ? 'border-accent shadow-focus' : 'border-line',
          )}
        >
          <span className={cn('min-w-0 flex-1 truncate', selected ? 'font-semibold' : 'text-muted')}>
            {selected?.name ?? 'Escolha o bairro'}
          </span>
          {selected && <ZoneFee fee={selected.fee} freeDelivery={freeDelivery} />}
          <ChevronDown
            size={18}
            strokeWidth={2.5}
            aria-hidden="true"
            className={cn('flex-none text-muted transition-transform duration-200', open && isDesktop && 'rotate-180')}
          />
        </button>

        {isDesktop && open && (
          <div
            ref={panelRef}
            onKeyDown={(event) => event.key === 'Escape' && close()}
            className="absolute inset-x-0 top-[calc(100%+8px)] z-30 overflow-hidden rounded-control border border-line bg-surface shadow-float"
          >
            {list}
          </div>
        )}
      </div>

      {!isDesktop && (
        <Dialog
          open={open}
          onClose={() => close()}
          variant="modal"
          ariaLabelledBy={titleId}
          className={cn('flex-col', zones.length >= SEARCH_MIN_ZONES && 'h-[88vh]')}
        >
          <div className="flex items-center justify-between gap-3 border-b border-line px-5 pt-5 pb-3.5">
            <div>
              <h2 id={titleId} className="font-display text-[28px] leading-none uppercase">
                Escolha o bairro
              </h2>
              <p className="mt-1 text-[13px] text-muted">
                {freeDelivery ? 'Entrega grátis para todos os bairros.' : 'A taxa de entrega aparece ao lado.'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => close()}
              aria-label="Fechar"
              className="grid size-11 flex-none place-items-center rounded-full bg-surface-alt text-ink"
            >
              <X size={18} aria-hidden="true" />
            </button>
          </div>
          {list}
        </Dialog>
      )}
    </FieldShell>
  );
}
