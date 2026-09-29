import { useEffect, useState, type FormEvent } from 'react';
import { defaultStoreSettings } from '../../data/storeConfig';
import { describeError, supabase } from '../../services/supabaseClient';
import { settingsFromRow, settingsToRow, type StoreSettingsRow } from '../../services/siteDataMapper';
import type { DayHours, StoreSettings, StoreStatusOverride, Weekday } from '../../types/store';
import { cn } from '../../utils/cn';
import { WEEK_ORDER, formatClock, parseClock, weekdayLabel } from '../../utils/storeHours';
import { Button } from '../ui/Button/Button';
import { ADMIN_CARD, ADMIN_INPUT, AdminInput, AdminSectionTitle, FeedbackMessage, Toggle, type Feedback } from './adminUi';
import { parsePrice, priceToInput } from './priceInput';

const STATUS_OPTIONS: { value: StoreStatusOverride; title: string; description: string }[] = [
  { value: 'auto', title: 'Automático', description: 'Segue os horários abaixo' },
  { value: 'open', title: 'Forçar aberto', description: 'Aceita pedidos agora' },
  { value: 'closed', title: 'Forçar fechado', description: 'Folga, feriado, imprevisto' },
];

/** Horário de um dia em edição (texto dos campos `type="time"`). */
interface DayDraft {
  day: Weekday;
  open: boolean;
  opensAt: string;
  closesAt: string;
}

function toDayDrafts(weeklyHours: DayHours[]): DayDraft[] {
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

function fromDayDrafts(drafts: DayDraft[]): { weeklyHours: DayHours[]; error?: string } {
  const weeklyHours: DayHours[] = [];
  for (const draft of drafts) {
    if (!draft.open) {
      weeklyHours.push({ day: draft.day, opensAt: null, closesAt: null });
      continue;
    }
    const opensAt = parseClock(draft.opensAt);
    const closesAt = parseClock(draft.closesAt, true);
    if (opensAt === null || closesAt === null) {
      return { weeklyHours, error: `${weekdayLabel(draft.day)}: preencha o horário de abertura e de fechamento.` };
    }
    if (closesAt <= opensAt) {
      return {
        weeklyHours,
        error: `${weekdayLabel(draft.day)}: o fechamento precisa ser depois da abertura (até 00:00).`,
      };
    }
    weeklyHours.push({ day: draft.day, opensAt, closesAt });
  }
  return { weeklyHours };
}

export function SettingsEditor() {
  const [settings, setSettings] = useState<StoreSettings>(defaultStoreSettings);
  const [days, setDays] = useState<DayDraft[]>(() => toDayDrafts(defaultStoreSettings.weeklyHours));
  const [fee, setFee] = useState(() => priceToInput(defaultStoreSettings.deliveryFee));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>(null);

  useEffect(() => {
    let active = true;
    supabase
      ?.from('store_settings')
      .select('*')
      .eq('id', 1)
      .maybeSingle<StoreSettingsRow>()
      .then(({ data, error }) => {
        if (!active) return;
        if (error) setFeedback({ tone: 'error', message: describeError(error) });
        const loaded = data ? settingsFromRow(data, defaultStoreSettings) : defaultStoreSettings;
        setSettings(loaded);
        setDays(toDayDrafts(loaded.weeklyHours));
        setFee(priceToInput(loaded.deliveryFee));
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const update = <K extends keyof StoreSettings>(field: K, value: StoreSettings[K]) => {
    setSettings((current) => ({ ...current, [field]: value }));
    setFeedback(null);
  };

  const updateDay = (day: Weekday, patch: Partial<DayDraft>) => {
    setDays((current) => current.map((draft) => (draft.day === day ? { ...draft, ...patch } : draft)));
    setFeedback(null);
  };

  const save = async (event: FormEvent) => {
    event.preventDefault();
    if (!supabase) return;

    const { weeklyHours, error: hoursError } = fromDayDrafts(days);
    const deliveryFee = parsePrice(fee);
    if (hoursError) return setFeedback({ tone: 'error', message: hoursError });
    if (deliveryFee === null) return setFeedback({ tone: 'error', message: 'Taxa de entrega inválida. Ex.: 5,00' });
    if (!settings.deliveryEnabled && !settings.pickupEnabled) {
      return setFeedback({ tone: 'error', message: 'Deixe pelo menos entrega ou retirada ativada.' });
    }

    setSaving(true);
    const next = { ...settings, weeklyHours, deliveryFee };
    const { error } = await supabase
      .from('store_settings')
      .upsert({ id: 1, ...settingsToRow(next), updated_at: new Date().toISOString() });
    setSaving(false);

    if (error) return setFeedback({ tone: 'error', message: describeError(error) });
    setSettings(next);
    setFeedback({ tone: 'success', message: 'Configurações salvas. O site já mostra os novos dados.' });
  };

  return (
    <form onSubmit={save} className="flex flex-col gap-5" aria-busy={loading}>
      <section className={ADMIN_CARD}>
        <AdminSectionTitle description="Use para folgas e feriados sem mexer nos horários. Lembre de voltar para Automático.">
          Status da loja
        </AdminSectionTitle>
        <div role="radiogroup" aria-label="Status da loja" className="grid gap-2.5 sm:grid-cols-3">
          {STATUS_OPTIONS.map((option) => (
            <label
              key={option.value}
              className={cn(
                'flex cursor-pointer flex-col rounded-control border-2 border-line p-3.5 transition-colors duration-200',
                'has-checked:border-accent has-checked:bg-surface-alt',
                'has-focus-visible:outline-[3px] has-focus-visible:outline-offset-2 has-focus-visible:outline-mustard has-focus-visible:outline-solid',
              )}
            >
              <input
                type="radio"
                name="statusOverride"
                value={option.value}
                checked={settings.statusOverride === option.value}
                onChange={() => update('statusOverride', option.value)}
                className="sr-only"
              />
              <span className="font-extrabold">{option.title}</span>
              <span className="text-sm text-muted">{option.description}</span>
            </label>
          ))}
        </div>
      </section>

      <section className={ADMIN_CARD}>
        <AdminSectionTitle description="Horários do dia. Para fechar à meia-noite, use 00:00.">
          Horário de funcionamento
        </AdminSectionTitle>
        <ul className="flex flex-col divide-y divide-line">
          {days.map((draft) => (
            <li key={draft.day} className="flex flex-wrap items-center gap-x-4 gap-y-2 py-3">
              <Toggle
                checked={draft.open}
                onChange={(open) => updateDay(draft.day, { open })}
                label={<span className="w-[72px]">{weekdayLabel(draft.day)}</span>}
              />
              {draft.open ? (
                <div className="flex items-center gap-2">
                  <input
                    type="time"
                    aria-label={`${weekdayLabel(draft.day)}: abre às`}
                    value={draft.opensAt}
                    onChange={(event) => updateDay(draft.day, { opensAt: event.target.value })}
                    className={cn(ADMIN_INPUT, 'w-[118px]')}
                  />
                  <span className="text-sm text-muted">às</span>
                  <input
                    type="time"
                    aria-label={`${weekdayLabel(draft.day)}: fecha às`}
                    value={draft.closesAt}
                    onChange={(event) => updateDay(draft.day, { closesAt: event.target.value })}
                    className={cn(ADMIN_INPUT, 'w-[118px]')}
                  />
                </div>
              ) : (
                <span className="text-sm font-semibold text-muted">Fechado</span>
              )}
            </li>
          ))}
        </ul>
      </section>

      <section className={ADMIN_CARD}>
        <AdminSectionTitle>Entrega e retirada</AdminSectionTitle>
        <div className="flex flex-wrap gap-x-8 gap-y-3">
          <Toggle
            checked={settings.deliveryEnabled}
            onChange={(value) => update('deliveryEnabled', value)}
            label="Entrega ativada"
          />
          <Toggle
            checked={settings.pickupEnabled}
            onChange={(value) => update('pickupEnabled', value)}
            label="Retirada ativada"
          />
        </div>
        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          <AdminInput
            id="delivery-fee"
            label="Taxa de entrega (R$)"
            hint="0,00 = grátis"
            inputMode="decimal"
            value={fee}
            onChange={(event) => {
              setFee(event.target.value);
              setFeedback(null);
            }}
          />
          <AdminInput
            id="delivery-eta"
            label="Tempo de entrega"
            placeholder="~40 min"
            value={settings.deliveryEta}
            onChange={(event) => update('deliveryEta', event.target.value)}
          />
          <AdminInput
            id="pickup-eta"
            label="Tempo de retirada"
            placeholder="~20 min"
            value={settings.pickupEta}
            onChange={(event) => update('pickupEta', event.target.value)}
          />
        </div>
      </section>

      <div className="sticky bottom-3 z-10 flex flex-col gap-2.5 rounded-sheet border border-line bg-surface/95 p-3 shadow-float backdrop-blur-sm sm:flex-row sm:items-center">
        <div className="flex-1">
          <FeedbackMessage feedback={feedback} />
        </div>
        <Button type="submit" disabled={loading || saving} shape="soft" size="md">
          {saving ? 'SALVANDO…' : 'SALVAR CONFIGURAÇÕES'}
        </Button>
      </div>
    </form>
  );
}
