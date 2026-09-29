import { lazy } from 'react';
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

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
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
