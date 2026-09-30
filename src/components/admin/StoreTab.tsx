import { useState } from 'react';
import type { DayHours, StoreSettings, Weekday } from '../../types/store';
import { cn } from '../../utils/cn';
import { formatCurrency } from '../../utils/currency';
import { formatWhatsappDisplay, onlyDigits } from '../../utils/formatters';
import { WEEK_ORDER, formatClock, parseClock, weekdayLabel } from '../../utils/storeHours';
import { parsePrice, priceToInput } from './adminFormat';
import { BTN_PRIMARY, CARD, CARD_PAD, Field, INPUT, MUTED, PrefixedInput, Switch } from './adminUi';
import type { AdminData } from './useAdminData';

interface DayDraft {
  day: Weekday;
  open: boolean;
  opensAt: string;
  closesAt: string;
}

function toDrafts(weeklyHours: DayHours[]): DayDraft[] {
  const byDay = new Map(weeklyHours.map((entry) => [entry.day, entry]));
  return WEEK_ORDER.map((day) => {
    const entry = byDay.get(day);
    const open = entry?.opensAt != null && entry?.closesAt != null;
    return {
      day,
      open,
      opensAt: open ? formatClock(entry.opensAt ?? 0) : '19:00',
      closesAt: open ? formatClock(entry.closesAt ?? 0) : '23:00',
    };
  });
}

function fromDrafts(drafts: DayDraft[]): { weeklyHours: DayHours[]; error?: string } {
  const weeklyHours: DayHours[] = [];
  for (const draft of drafts) {
    if (!draft.open) {
      weeklyHours.push({ day: draft.day, opensAt: null, closesAt: null });
      continue;
    }
    const opensAt = parseClock(draft.opensAt);
    const closesAt = parseClock(draft.closesAt, true);
    if (opensAt === null || closesAt === null) {
      return { weeklyHours, error: `${weekdayLabel(draft.day)}: preencha abertura e fechamento.` };
    }
    if (closesAt <= opensAt) {
      return { weeklyHours, error: `${weekdayLabel(draft.day)}: o fechamento precisa ser depois da abertura (até 00:00).` };
    }
    weeklyHours.push({ day: draft.day, opensAt, closesAt });
  }
  return { weeklyHours };
}

/** Campo de texto que grava ao sair do campo (ou com Enter), como no mockup. */
function useCommitField(current: string, commit: (value: string) => void) {
  const [draft, setDraft] = useState<string | null>(null);
  return {
    value: draft ?? current,
    onChange: (event: { target: { value: string } }) => setDraft(event.target.value),
    onBlur: () => {
      if (draft !== null && draft !== current) commit(draft);
      setDraft(null);
    },
    onKeyDown: (event: { key: string; currentTarget: HTMLInputElement }) => {
      if (event.key === 'Enter') event.currentTarget.blur();
    },
  };
}

export function StoreTab({ data, onSignOut }: { data: AdminData; onSignOut: () => void }) {
  const { settings, saveSettings, notify } = data;
  const [days, setDays] = useState<DayDraft[] | null>(null);
  const hours = days ?? toDrafts(settings.weeklyHours);

  const save = (patch: Partial<StoreSettings>, text: string) => void saveSettings(patch, text);

  const feeField = useCommitField(priceToInput(settings.deliveryFee), (value) => {
    const fee = parsePrice(value);
    if (fee === null) return notify('Taxa inválida. Ex.: 5,00', 'error');
    save({ deliveryFee: fee }, `Taxa de entrega: ${fee ? formatCurrency(fee) : 'grátis'}`);
  });
  const whatsappField = useCommitField(settings.whatsapp, (value) => {
    const digits = onlyDigits(value);
    if (!/^\d{12,13}$/.test(digits)) return notify('WhatsApp inválido: use DDI + DDD + número, ex.: 5549988083394', 'error');
    save({ whatsapp: digits }, `WhatsApp atualizado: ${formatWhatsappDisplay(digits)}`);
  });
  const deliveryEtaField = useCommitField(settings.deliveryEta, (value) =>
    save({ deliveryEta: value.trim() || '~40 min' }, 'Tempo de entrega salvo'),
  );
  const pickupEtaField = useCommitField(settings.pickupEta, (value) =>
    save({ pickupEta: value.trim() || '~20 min' }, 'Tempo de retirada salvo'),
  );

  const updateDay = (day: Weekday, patch: Partial<DayDraft>) =>
    setDays(hours.map((draft) => (draft.day === day ? { ...draft, ...patch } : draft)));

  const saveHours = async () => {
    const { weeklyHours, error } = fromDrafts(hours);
    if (error) return notify(error, 'error');
    if (await saveSettings({ weeklyHours }, 'Horários salvos')) setDays(null);
  };

  return (
    <div className="flex max-w-[720px] flex-col gap-4">
      <section className={cn(CARD, CARD_PAD, 'grid grid-cols-[repeat(auto-fit,minmax(min(100%,240px),1fr))] gap-4')}>
        <Field id="s-fee" label="Taxa de entrega" hint="Use 0 para frete grátis.">
          <PrefixedInput id="s-fee" prefix="R$" inputMode="decimal" {...feeField} />
        </Field>
        <Field id="s-wa" label="WhatsApp que recebe os pedidos" hint="Com DDI + DDD, só números.">
          <input
            id="s-wa"
            inputMode="tel"
            placeholder="5549999999999"
            className={cn(INPUT, 'font-bold tabular-nums')}
            {...whatsappField}
          />
        </Field>
      </section>

      <section className={cn(CARD, CARD_PAD)}>
        <h2 className="m-0 text-[17px] font-extrabold">Horário de funcionamento</h2>
        <p className={cn('mt-0.5 mb-3 text-sm', MUTED)}>
          No modo automático a loja abre e fecha seguindo esta tabela. Para fechar à meia-noite, use 00:00.
        </p>
        {hours.map((draft) => (
          <div
            key={draft.day}
            className="flex min-h-[52px] flex-wrap items-center justify-between gap-x-4 gap-y-2 border-t border-[#efe8dd] py-2.5 text-[15px]"
          >
            <span className="flex items-center gap-3 font-bold">
              <Switch
                label={`Aberto ${weekdayLabel(draft.day)}`}
                checked={draft.open}
                onChange={(open) => updateDay(draft.day, { open })}
              />
              {weekdayLabel(draft.day)}
            </span>
            {draft.open ? (
              <span className="flex items-center gap-2">
                <input
                  type="time"
                  aria-label={`${weekdayLabel(draft.day)}: abre às`}
                  value={draft.opensAt}
                  onChange={(event) => updateDay(draft.day, { opensAt: event.target.value })}
                  className={cn(INPUT, 'h-11 w-[118px] px-2.5')}
                />
                <span className={cn('text-sm', MUTED)}>às</span>
                <input
                  type="time"
                  aria-label={`${weekdayLabel(draft.day)}: fecha às`}
                  value={draft.closesAt}
                  onChange={(event) => updateDay(draft.day, { closesAt: event.target.value })}
                  className={cn(INPUT, 'h-11 w-[118px] px-2.5')}
                />
              </span>
            ) : (
              <span className={MUTED}>Fechado</span>
            )}
          </div>
        ))}
        {days && (
          <div className="mt-3 flex flex-wrap items-center justify-end gap-2.5 border-t border-[#efe8dd] pt-4">
            <span className={cn('mr-auto text-sm', MUTED)}>Alterações ainda não salvas.</span>
            <button
              type="button"
              onClick={() => setDays(null)}
              className="h-11 cursor-pointer rounded-[10px] px-3 text-sm font-bold text-[#6a5c4d] hover:text-[#1c1611]"
            >
              Desfazer
            </button>
            <button type="button" onClick={() => void saveHours()} disabled={data.saving} className={BTN_PRIMARY}>
              SALVAR HORÁRIOS
            </button>
          </div>
        )}
      </section>

      <section className={cn(CARD, CARD_PAD)}>
        <h2 className="m-0 text-[17px] font-extrabold">Entrega e retirada</h2>
        <div className="mt-3 flex flex-wrap gap-x-8 gap-y-3">
          {(
            [
              ['deliveryEnabled', 'Entrega'],
              ['pickupEnabled', 'Retirada no balcão'],
            ] as const
          ).map(([field, label]) => (
            <span key={field} className="flex items-center gap-3 font-bold">
              <Switch
                label={label}
                checked={settings[field]}
                onChange={(on) => {
                  const other = field === 'deliveryEnabled' ? settings.pickupEnabled : settings.deliveryEnabled;
                  if (!on && !other) return notify('Deixe pelo menos entrega ou retirada ativada', 'error');
                  save({ [field]: on }, `${label} ${on ? 'ativada' : 'desativada'}`);
                }}
              />
              {label}
            </span>
          ))}
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <Field id="s-deta" label="Tempo de entrega">
            <input id="s-deta" placeholder="~40 min" className={INPUT} {...deliveryEtaField} />
          </Field>
          <Field id="s-peta" label="Tempo de retirada">
            <input id="s-peta" placeholder="~20 min" className={INPUT} {...pickupEtaField} />
          </Field>
        </div>
      </section>

      <button
        type="button"
        onClick={onSignOut}
        className="h-12 cursor-pointer rounded-xl border-[1.5px] border-[#e4dccf] bg-white text-sm font-bold text-[#6a5c4d] min-[960px]:hidden"
      >
        Sair do painel
      </button>
    </div>
  );
}
