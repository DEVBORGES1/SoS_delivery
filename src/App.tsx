import { lazy, Suspense } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router';
import { AppLayout } from './components/layout/AppLayout';
import { HomePage } from './pages/Home/HomePage';
import { ROUTES } from './routes';

// Checkout e confirmação só são baixados quando o cliente chega neles.
const CheckoutPage = lazy(() =>
  import('./pages/Checkout/CheckoutPage').then((module) => ({ default: module.CheckoutPage })),
);
const OrderConfirmationPage = lazy(() =>
  import('./pages/OrderConfirmation/OrderConfirmationPage').then((module) => ({
    default: module.OrderConfirmationPage,
  })),
);

// Painel da loja: carrega o SDK do Supabase só para quem acessa /admin.
const AdminPage = lazy(() => import('./pages/Admin/AdminPage').then((module) => ({ default: module.AdminPage })));

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path={ROUTES.admin}
          element={
            <Suspense fallback={<div className="min-h-screen bg-bg" />}>
              <AdminPage />
            </Suspense>
          }
        />
        <Route element={<AppLayout />}>
          <Route index element={<HomePage />} />
          <Route path={ROUTES.checkout} element={<CheckoutPage />} />
          <Route path={ROUTES.confirmation} element={<OrderConfirmationPage />} />
          <Route path="*" element={<Navigate to={ROUTES.home} replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
