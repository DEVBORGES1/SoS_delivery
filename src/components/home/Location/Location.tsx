import { storeConfig } from '../../../data/storeConfig';
import { useStoreStatus } from '../../../hooks/useStoreStatus';
import { cn } from '../../../utils/cn';
import { formatHoursRange, isClosedAllDay } from '../../../utils/storeHours';
import { buttonClasses } from '../../ui/Button/buttonStyles';
import { Badge } from '../../ui/Badge/Badge';
import { StatusDot } from '../../ui/StatusDot/StatusDot';

const CARD = 'rounded-sheet border border-line bg-surface';

function OpeningHoursCard() {
  const { isOpen, today, labels } = useStoreStatus();

  return (
    <div className={cn(CARD, 'p-[clamp(24px,3.5vw,40px)]')}>
      <h2 className="font-display text-[clamp(32px,4vw,48px)] leading-none uppercase">Horário de funcionamento</h2>
      <div
        className={cn(
          'mt-[18px] inline-flex items-center gap-2.5 rounded-field px-4 py-2.5 text-[15px] font-extrabold',
          isOpen ? 'bg-status-open/14 text-success-ink' : 'bg-status-closed/14 text-danger',
        )}
      >
        <StatusDot isOpen={isOpen} />
        {labels.long}
      </div>
      <ul className="mt-6 flex flex-col gap-1">
        {storeConfig.openingHours.map((hours) => {
          const isToday = hours.days.includes(today);
          return (
            <li
              key={hours.label}
              className={cn(
                'flex items-center justify-between gap-3 rounded-field p-3.5 text-base',
                isToday && 'bg-surface-alt',
              )}
            >
              <span className="flex items-center gap-2.5 font-bold">
                {hours.label}
                {isToday && (
                  <Badge tone="accent" size="sm" className="tracking-[.08em]">
                    HOJE
                  </Badge>
                )}
              </span>
              <span className={cn('font-semibold tabular-nums', isClosedAllDay(hours) && 'text-muted')}>
                {formatHoursRange(hours)}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function LocationCard() {
  return (
    <div className={cn(CARD, 'flex flex-col overflow-hidden')}>
      <div className="bg-stripes relative grid min-h-60 flex-1 place-items-center">
        <div className="flex flex-col items-center gap-2.5">
          <span aria-hidden="true" className="size-[22px] rounded-full bg-accent shadow-[0_0_0_8px_rgb(211_48_31/0.25)]" />
          <span className="font-mono text-xs text-muted">mapa · incorporar Google Maps</span>
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-4 p-[clamp(24px,3vw,32px)]">
        <div>
          <h2 className="font-display text-[28px] uppercase">Onde estamos</h2>
          <address className="mt-1.5 text-[15px] text-muted not-italic">
            {storeConfig.address} — {storeConfig.district}
            <br />
            {storeConfig.city} / {storeConfig.state} · {storeConfig.zipCode}
          </address>
        </div>
        <a
          href={storeConfig.mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={buttonClasses({ size: 'md' })}
        >
          COMO CHEGAR →
        </a>
      </div>
    </div>
  );
}

export function Location() {
  return (
    <section
      id="contato"
      aria-label="Horário e localização"
      className="scroll-mt-[72px] bg-bg-alt px-gutter py-[clamp(64px,9vw,112px)]"
    >
      <div className="mx-auto grid max-w-[1280px] grid-cols-[repeat(auto-fit,minmax(min(100%,400px),1fr))] gap-[clamp(16px,2vw,24px)]">
        <OpeningHoursCard />
        <LocationCard />
      </div>
    </section>
  );
}
