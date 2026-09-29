import type { MouseEvent } from 'react';
import { Link, type LinkProps } from 'react-router';
import { useUIStore } from '../../stores/uiStore';

type SectionLinkProps = Omit<LinkProps, 'to'> & { sectionId: string };

/** Link para uma seção da home ("/#cardapio") que fecha menu e carrinho ao navegar. */
export function SectionLink({ sectionId, onClick, ...props }: SectionLinkProps) {
  const closeMobileMenu = useUIStore((state) => state.closeMobileMenu);
  const closeCart = useUIStore((state) => state.closeCart);

  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    closeMobileMenu();
    closeCart();
    onClick?.(event);
  };

  return <Link to={{ pathname: '/', hash: `#${sectionId}` }} onClick={handleClick} {...props} />;
}
