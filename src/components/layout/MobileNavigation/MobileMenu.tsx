import { navItems } from '../../../data/homeContent';
import { useStoreStatus } from '../../../hooks/useStoreStatus';
import { buttonClasses } from '../../ui/Button/buttonStyles';
import { StatusDot } from '../../ui/StatusDot/StatusDot';
import { SectionLink } from '../SectionLink';

/** Menu expandido abaixo do cabeçalho em telas menores que 1024px. */
export function MobileMenu() {
  const { isOpen, labels } = useStoreStatus();

  return (
    <nav
      id="mobile-menu"
      aria-label="Menu"
      className="flex flex-col gap-1 border-t border-line bg-bg px-gutter pt-3 pb-5 lg:hidden"
    >
      {navItems.map((item) => (
        <SectionLink
          key={item.sectionId}
          sectionId={item.sectionId}
          className="py-2 text-left font-display text-[30px] tracking-[.01em] uppercase"
        >
          {item.label}
        </SectionLink>
      ))}
      <span className="mt-2.5 mb-3.5 flex items-center gap-2 text-sm font-semibold text-muted">
        <StatusDot isOpen={isOpen} />
        {labels.long}
      </span>
      <SectionLink sectionId="cardapio" className={buttonClasses({ size: 'lg', shape: 'soft', fullWidth: true })}>
        PEDIR AGORA
      </SectionLink>
    </nav>
  );
}
