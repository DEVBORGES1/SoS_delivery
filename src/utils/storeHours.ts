import type { DayHours, OpeningHours, StoreStatus, StoreStatusOverride, Weekday } from '../types/store';

const WEEKDAY_NAMES = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];
const WEEKDAY_LABELS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
const WEEKDAY_SHORT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

/** Ordem de exibição: segunda a domingo. */
export const WEEK_ORDER: Weekday[] = [1, 2, 3, 4, 5, 6, 0];

export function weekdayLabel(day: Weekday): string {
  return WEEKDAY_LABELS[day];
}

function splitHour(hour: number): [string, string] {
  const totalMinutes = Math.round(hour * 60) % (24 * 60);
  const hh = String(Math.floor(totalMinutes / 60)).padStart(2, '0');
  const mm = String(totalMinutes % 60).padStart(2, '0');
  return [hh, mm];
}

/** 18 → "18h", 18.5 → "18h30", 24 → "00h" */
function formatHour(hour: number): string {
  const [hh, mm] = splitHour(hour);
  return mm === '00' ? `${hh}h` : `${hh}h${mm}`;
}

/** 18 → "18:00", 18.5 → "18:30", 24 → "00:00" (formato do `<input type="time">`) */
export function formatClock(hour: number): string {
  const [hh, mm] = splitHour(hour);
  return `${hh}:${mm}`;
}

/** "18:30" → 18.5. Com `isClosing`, "00:00" vira 24 (meia-noite). */
export function parseClock(value: string, isClosing = false): number | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(value);
  if (!match) return null;
  const hour = Number(match[1]) + Number(match[2]) / 60;
  if (hour >= 24) return null;
  return isClosing && hour === 0 ? 24 : hour;
}

function joinDayLabels(labels: string[], first: Weekday, last: Weekday, count: number): string {
  if (count === 1) return labels[first];
  if (count === 2) return `${labels[first]} e ${labels[last]}`;
  return `${labels[first]} a ${labels[last]}`;
}

/**
 * Agrupa dias seguidos (de segunda a domingo) com o mesmo horário:
 * quarta, quinta, sexta, sábado e domingo às 19h–23h viram "Quarta a Domingo".
 * Dias ausentes da lista contam como fechados.
 */
export function groupWeeklyHours(weeklyHours: DayHours[]): OpeningHours[] {
  const byDay = new Map(weeklyHours.map((entry) => [entry.day, entry]));
  const groups: { days: Weekday[]; opensAt: number | null; closesAt: number | null }[] = [];

  for (const day of WEEK_ORDER) {
    const entry = byDay.get(day);
    const isOpen = entry?.opensAt != null && entry?.closesAt != null;
    const opensAt = isOpen ? entry.opensAt : null;
    const closesAt = isOpen ? entry.closesAt : null;
    const previous = groups.at(-1);

    if (previous && previous.opensAt === opensAt && previous.closesAt === closesAt) {
      previous.days.push(day);
    } else {
      groups.push({ days: [day], opensAt, closesAt });
    }
  }

  return groups.map(({ days, opensAt, closesAt }) => {
    const first = days[0];
    const last = days[days.length - 1];
    return {
      label: joinDayLabels(WEEKDAY_LABELS, first, last, days.length),
      shortLabel: joinDayLabels(WEEKDAY_SHORT, first, last, days.length),
      days,
      opensAt,
      closesAt,
    };
  });
}

export function isClosedAllDay(hours: OpeningHours): boolean {
  return hours.opensAt === null || hours.closesAt === null;
}

/** "19:00 às 23:00" ou "Fechado". */
export function formatHoursRange(hours: OpeningHours): string {
  if (isClosedAllDay(hours)) return 'Fechado';
  return `${formatClock(hours.opensAt ?? 0)} às ${formatClock(hours.closesAt ?? 0)}`;
}

/** "18h–23h" ou "fechado". */
export function formatHoursShort(hours: OpeningHours): string {
  if (isClosedAllDay(hours)) return 'fechado';
  return `${formatHour(hours.opensAt ?? 0)}–${formatHour(hours.closesAt ?? 0)}`;
}

function findHoursForDay(schedule: OpeningHours[], day: Weekday): OpeningHours | undefined {
  return schedule.find((entry) => entry.days.includes(day));
}

function findNextOpening(schedule: OpeningHours[], today: Weekday, hourNow: number) {
  for (let offset = 0; offset < 7; offset++) {
    const day = ((today + offset) % 7) as Weekday;
    const hours = findHoursForDay(schedule, day);
    if (!hours || isClosedAllDay(hours)) continue;
    if (offset === 0 && hourNow >= (hours.opensAt ?? 0)) continue;

    const dayLabel = offset === 0 ? 'hoje' : offset === 1 ? 'amanhã' : WEEKDAY_NAMES[day];
    return { day: dayLabel, time: formatHour(hours.opensAt ?? 0) };
  }
  return { day: '', time: '' };
}

export function getStoreStatus(
  schedule: OpeningHours[],
  override: StoreStatusOverride,
  now: Date = new Date(),
): StoreStatus {
  const today = now.getDay() as Weekday;
  const hourNow = now.getHours() + now.getMinutes() / 60;
  const todayHours = findHoursForDay(schedule, today);

  const isOpenBySchedule =
    !!todayHours &&
    !isClosedAllDay(todayHours) &&
    hourNow >= (todayHours.opensAt ?? 0) &&
    hourNow < (todayHours.closesAt ?? 0);

  const isOpen = override === 'auto' ? isOpenBySchedule : override === 'open';
  const next = findNextOpening(schedule, today, hourNow);

  return {
    isOpen,
    closesAtLabel: todayHours?.closesAt ? formatHour(todayHours.closesAt) : '',
    nextOpenDay: next.day,
    nextOpenTime: next.time,
    today,
  };
}

export interface StoreStatusLabels {
  /** "Aberto agora" */
  short: string;
  /** "Aberto agora · fecha às 23h" */
  long: string;
  /** "ABERTO AGORA · ENTREGA EM ~40 MIN" */
  chip: string;
  /** "hoje às 18h" */
  nextOpening: string;
}

export function getStoreStatusLabels(status: StoreStatus, deliveryEta: string): StoreStatusLabels {
  const nextOpening = `${status.nextOpenDay} às ${status.nextOpenTime}`;

  if (status.isOpen) {
    return {
      short: 'Aberto agora',
      long: `Aberto agora · fecha às ${status.closesAtLabel}`,
      chip: `ABERTO AGORA · ENTREGA EM ${deliveryEta.toUpperCase()}`,
      nextOpening,
    };
  }

  return {
    short: 'Fechado agora',
    long: `Fechado · abre ${nextOpening}`,
    chip: `FECHADO · ABRE ${nextOpening.toUpperCase()}`,
    nextOpening,
  };
}
