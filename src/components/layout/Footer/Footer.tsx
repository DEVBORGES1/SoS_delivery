import { navItems } from '../../../data/homeContent';
import { storeConfig } from '../../../data/storeConfig';
import { getDirectChatUrl } from '../../../services/whatsappService';
import { cn } from '../../../utils/cn';
import { formatHoursShort, isClosedAllDay } from '../../../utils/storeHours';
import { LogoMark } from '../../ui/Logo/Logo';
import { SectionLink } from '../SectionLink';

const COLUMN_TITLE = 'mb-3 text-xs font-extrabold tracking-[.18em] text-footer-muted';

/** Dias abertos primeiro; dias fechados no fim, esmaecidos. */
const footerHours = [...storeConfig.openingHours].sort(
  (a, b) => Number(isClosedAllDay(a)) - Number(isClosedAllDay(b)),
);

const CURRENT_YEAR = new Date().getFullYear();

export function Footer() {
  return (
    <footer className="bg-footer px-gutter pt-[clamp(48px,7vw,80px)] pb-7 text-footer-ink">
      <div className="mx-auto grid max-w-[1280px] grid-cols-[repeat(auto-fit,minmax(min(100%,200px),1fr))] gap-8">
        <div className="flex flex-col gap-3.5">
          <div className="flex items-center gap-2.5">
            <LogoMark />
            <span className="font-display text-[17px] tracking-[.06em]">DELIVERY VIDEIRA</span>
          </div>
          <p className="max-w-[260px] text-sm text-footer-muted">{storeConfig.tagline}</p>
        </div>

        <nav aria-label="Rodapé">
          <h2 className={COLUMN_TITLE}>NAVEGUE</h2>
          <ul className="flex flex-col gap-1">
            {navItems.map((item) => (
              <li key={item.sectionId}>
                <SectionLink sectionId={item.sectionId} className="block py-1.5 text-[15px] hover:opacity-85">
                  {item.label}
                </SectionLink>
              </li>
            ))}
          </ul>
        </nav>

        <div>
          <h2 className={COLUMN_TITLE}>CONTATO</h2>
          <address className="flex flex-col gap-2.5 text-[15px] not-italic">
            <a href={storeConfig.instagramUrl} target="_blank" rel="noopener noreferrer" className="hover:opacity-85">
              Instagram · {storeConfig.instagram}
            </a>
            <a href={getDirectChatUrl()} target="_blank" rel="noopener noreferrer" className="hover:opacity-85">
              WhatsApp · {storeConfig.whatsappDisplay}
            </a>
            <span className="text-footer-muted">
              {storeConfig.address} — {storeConfig.district}, {storeConfig.city}/{storeConfig.state}
            </span>
          </address>
        </div>

        <div>
          <h2 className={COLUMN_TITLE}>HORÁRIO</h2>
          <ul className="flex flex-col gap-1.5 text-sm text-footer-soft">
            {footerHours.map((hours) => (
              <li key={hours.label} className={cn(isClosedAllDay(hours) && 'text-footer-dim')}>
                {hours.shortLabel} · {formatHoursShort(hours)}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mx-auto mt-10 flex max-w-[1280px] flex-wrap justify-between gap-2 border-t border-footer-ink/10 pt-5 text-[13px] text-footer-dim">
        <span>
          © {CURRENT_YEAR} {storeConfig.name}. Todos os direitos reservados.
        </span>
        <span>Pedidos finalizados via WhatsApp.</span>
      </div>
    </footer>
  );
}
