import { Menu } from 'lucide-react';
import { navItems } from '../../../data/homeContent';
import { storeConfig } from '../../../data/storeConfig';
import { useStoreStatus } from '../../../hooks/useStoreStatus';
import { useUIStore } from '../../../stores/uiStore';
import { cn } from '../../../utils/cn';
import { buttonClasses } from '../../ui/Button/buttonStyles';
import { LogoMark } from '../../ui/Logo/Logo';
import { StatusDot } from '../../ui/StatusDot/StatusDot';
import { MobileMenu } from '../MobileNavigation/MobileMenu';
import { SectionLink } from '../SectionLink';
import { CartButton } from './CartButton';

export function Header() {
  const { isOpen, labels } = useStoreStatus();
  const isMobileMenuOpen = useUIStore((state) => state.isMobileMenuOpen);
  const toggleMobileMenu = useUIStore((state) => state.toggleMobileMenu);

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-header backdrop-blur-[14px]">
      <div className="mx-auto flex h-[62px] max-w-[1280px] items-center justify-between gap-4 px-gutter md:h-[72px]">
        <SectionLink
          sectionId="inicio"
          aria-label={`${storeConfig.name} — início`}
          className="flex items-center gap-2.5 hover:opacity-85"
        >
          <LogoMark />
          <span aria-hidden="true" className="flex flex-col gap-[3px] text-left leading-none">
            <span className="font-display text-[17px] tracking-[.06em]">DELIVERY</span>
            <span className="text-[10px] font-extrabold tracking-[.32em] text-muted">VIDEIRA</span>
          </span>
        </SectionLink>

        <nav aria-label="Principal" className="hidden gap-1.5 lg:flex">
          {navItems.map((item) => (
            <SectionLink
              key={item.sectionId}
              sectionId={item.sectionId}
              className="rounded-full px-3.5 py-2.5 text-[15px] font-semibold transition-colors duration-200 hover:bg-line"
            >
              {item.label}
            </SectionLink>
          ))}
        </nav>

        <div className="flex items-center gap-2.5">
          <span className="hidden items-center gap-2 px-1.5 text-[13px] font-semibold text-muted lg:flex">
            <StatusDot isOpen={isOpen} />
            {labels.short}
          </span>
          <CartButton />
          <SectionLink
            sectionId="cardapio"
            className={cn(buttonClasses({ size: 'xs' }), 'hover:-translate-y-px max-lg:hidden')}
          >
            PEDIR AGORA
          </SectionLink>
          <button
            type="button"
            onClick={toggleMobileMenu}
            aria-label={isMobileMenuOpen ? 'Fechar menu' : 'Abrir menu'}
            aria-expanded={isMobileMenuOpen}
            aria-controls="mobile-menu"
            className="grid size-[46px] place-items-center rounded-full lg:hidden"
          >
            <Menu size={22} strokeWidth={2.2} aria-hidden="true" />
          </button>
        </div>
      </div>

      {isMobileMenuOpen && <MobileMenu />}
    </header>
  );
}
