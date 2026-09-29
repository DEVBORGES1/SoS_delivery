import type { OpeningHours, StoreStatus, StoreStatusOverride, Weekday } from '../types/store';

const WEEKDAY_NAMES = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];

/** 18 → "18h", 24 → "00h" */
function formatHour(hour: number): string {
  return `${String(hour % 24).padStart(2, '0')}h`;
}

/** 18 → "18:00", 24 → "00:00" */
function formatClock(hour: number): string {
  return `${String(hour % 24).padStart(2, '0')}:00`;
}

export function isClosedAllDay(hours: OpeningHours): boolean {
  return hours.opensAt === null || hours.closesAt === null;
}

/** "18:00 às 23:00" ou "Fechado". */
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
