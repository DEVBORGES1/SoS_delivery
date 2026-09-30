import { Suspense, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router';
import { ROUTES } from '../../routes';
import { CartDrawer } from '../cart/CartDrawer/CartDrawer';
import { CartToast } from '../cart/CartToast/CartToast';
import { ProductModal } from '../menu/ProductModal/ProductModal';
import { Footer } from './Footer/Footer';
import { Header } from './Header/Header';
import { AnnouncementBanner } from './StoreBanner/AnnouncementBanner';
import { ClosedStoreBanner } from './StoreBanner/ClosedStoreBanner';

export function AppLayout() {
  const { pathname } = useLocation();

  // Volta ao topo ao trocar de página; links com "#seção" rolam por conta própria.
  useEffect(() => {
    if (!window.location.hash) window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <>
      <a
        href="#conteudo"
        className="sr-only z-90 rounded-full bg-ink px-4 py-2 font-bold text-bg focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        Pular para o conteúdo
      </a>
      <Header />
      {pathname !== ROUTES.confirmation && <AnnouncementBanner />}
      {pathname !== ROUTES.confirmation && <ClosedStoreBanner />}
      <main id="conteudo">
        <Suspense fallback={<div className="min-h-screen" />}>
          <Outlet />
        </Suspense>
      </main>
      <Footer />
      <CartDrawer />
      <ProductModal />
      <CartToast />
    </>
  );
}
