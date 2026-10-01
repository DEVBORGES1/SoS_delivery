import type { Session } from '@supabase/supabase-js';
import { useCallback, useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { AdminShell } from '../../components/admin/AdminShell';
import type { AdminTab } from '../../components/admin/adminTabs';
import { BTN_PRIMARY, Field, INPUT } from '../../components/admin/adminUi';
import { MenuTab } from '../../components/admin/MenuTab';
import { NewOrderAlert } from '../../components/admin/NewOrderAlert';
import { ThemeToggle } from '../../components/layout/ThemeToggle/ThemeToggle';
import { OrdersTab, type OrderFilter } from '../../components/admin/OrdersTab';
import { OverviewTab } from '../../components/admin/OverviewTab';
import { ProductDrawer } from '../../components/admin/ProductDrawer';
import { PromotionDrawer, PromotionsTab } from '../../components/admin/PromotionsTab';
import { StoreTab } from '../../components/admin/StoreTab';
import { useAdminData } from '../../components/admin/useAdminData';
import { useOrderAlerts } from '../../components/admin/useOrderAlerts';
import { usePrinterHealthPolling } from '../../components/admin/printerStore';
import { describeError, supabase } from '../../services/supabaseClient';
import type { Product, Promotion } from '../../types/product';
import { cn } from '../../utils/cn';
import { isPromotionLive } from '../../utils/promotions';

/** Tela centralizada (login, carregando, sem permissão). */
function CenteredCard({ children }: { children: ReactNode }) {
  return (
    <div className="relative grid min-h-screen place-items-center bg-(--adm-page) p-4 font-sans text-(--adm-ink)">
      <ThemeToggle className="absolute top-4 right-4" />
      <meta name="robots" content="noindex, nofollow" />
      <div className="w-full max-w-[420px] rounded-[18px] border border-(--adm-line) bg-(--adm-card) p-7">
        <div className="mb-5 flex items-center gap-2.5">
          <span className="block -rotate-4 rounded-md bg-(--adm-accent) px-2 pt-1 pb-[3px] font-display text-[19px] leading-none text-white">
            S.O.S
          </span>
          <span className="flex flex-col leading-[1.1]">
            <span className="font-display text-[15px] tracking-[.05em]">DELIVERY</span>
            <span className="text-[11px] font-bold tracking-[.1em] text-(--adm-muted)">PAINEL DO LOJISTA</span>
          </span>
        </div>
        {children}
      </div>
    </div>
  );
}

function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!supabase) return;
    setLoading(true);
    const { error: signInError } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setLoading(false);
    if (signInError) setError(describeError(signInError));
  };

  return (
    <CenteredCard>
      <title>Entrar — Painel S.O.S</title>
      <form onSubmit={submit} className="flex flex-col gap-4">
        <h1 className="m-0 font-display text-[32px] leading-none font-normal uppercase">Entrar no painel</h1>
        <Field id="admin-email" label="E-mail">
          <input
            id="admin-email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className={INPUT}
          />
        </Field>
        <Field id="admin-password" label="Senha">
          <input
            id="admin-password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className={INPUT}
          />
        </Field>
        {error && (
          <p role="alert" className="m-0 rounded-[10px] bg-[#ff5a4a]/14 px-3.5 py-2.5 text-sm font-bold text-(--adm-danger)">
            {error}
          </p>
        )}
        <button type="submit" disabled={loading} className={cn(BTN_PRIMARY, 'h-[50px]')}>
          {loading ? 'ENTRANDO…' : 'ENTRAR'}
        </button>
      </form>
    </CenteredCard>
  );
}

type Editing =
  | { kind: 'product'; product: Product | null; category?: string }
  | { kind: 'promotion'; promotion: Promotion | null }
  | null;

function Dashboard() {
  const data = useAdminData();
  const [tab, setTab] = useState<AdminTab>('orders');
  const [orderFilter, setOrderFilter] = useState<OrderFilter>('ativos');
  const [editing, setEditing] = useState<Editing>(null);
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);

  const go = (next: AdminTab, options?: { orderFilter?: OrderFilter }) => {
    if (options?.orderFilter) setOrderFilter(options.orderFilter);
    setTab(next);
    window.scrollTo(0, 0);
  };

  // "Ver pedido" (alerta na tela ou aviso do navegador): vai para a lista e abre o pedido.
  const showOrder = useCallback((id: number) => {
    setEditing(null);
    setOrderFilter('ativos');
    setSelectedOrderId(id);
    setTab('orders');
    window.scrollTo(0, 0);
  }, []);
  const alerts = useOrderAlerts(data.orders, showOrder);
  usePrinterHealthPolling();
  const selectOrder = (id: number | null) => {
    if (id !== null) alerts.markSeen(id);
    setSelectedOrderId(id);
  };
  const newProduct = (category?: string) => setEditing({ kind: 'product', product: null, category });
  const newPromotion = () => setEditing({ kind: 'promotion', promotion: null });
  const signOut = () => void supabase?.auth.signOut();

  return (
    <AdminShell
      tab={tab}
      onTab={go}
      newOrders={data.orders.filter((order) => order.status === 'novo').length}
      livePromos={data.promotions.filter((promotion) => isPromotionLive(promotion)).length}
      statusOverride={data.settings.statusOverride}
      savedAt={data.savedAt}
      toast={data.toast}
      onSignOut={signOut}
    >
      {tab === 'orders' && (
        <OrdersTab
          data={data}
          filter={orderFilter}
          onFilter={setOrderFilter}
          selectedId={selectedOrderId}
          onSelect={selectOrder}
          unseenIds={alerts.unseenIds}
        />
      )}
      {tab === 'overview' && (
        <OverviewTab data={data} onGo={go} onNewProduct={() => newProduct()} onNewPromotion={newPromotion} />
      )}
      {tab === 'menu' && (
        <MenuTab data={data} onNew={newProduct} onEdit={(product) => setEditing({ kind: 'product', product })} />
      )}
      {tab === 'promos' && (
        <PromotionsTab
          data={data}
          onNew={newPromotion}
          onEdit={(promotion) => setEditing({ kind: 'promotion', promotion })}
        />
      )}
      {tab === 'store' && <StoreTab data={data} onSignOut={signOut} />}

      {editing?.kind === 'product' && (
        <ProductDrawer
          key={editing.product?.id ?? 'novo'}
          product={editing.product}
          defaultCategory={editing.category}
          data={data}
          onClose={() => setEditing(null)}
        />
      )}
      {editing?.kind === 'promotion' && (
        <PromotionDrawer
          key={editing.promotion?.id ?? 'nova'}
          promotion={editing.promotion}
          data={data}
          onClose={() => setEditing(null)}
        />
      )}

      <NewOrderAlert orders={alerts.unseenOrders} onOpen={alerts.open} onDismiss={alerts.markSeen} />
    </AdminShell>
  );
}

type AdminCheck = 'checking' | 'admin' | 'denied';

function AdminGate({ session }: { session: Session }) {
  const [check, setCheck] = useState<AdminCheck>('checking');

  useEffect(() => {
    let active = true;
    supabase?.rpc('is_admin').then(({ data, error }) => {
      if (active) setCheck(!error && data === true ? 'admin' : 'denied');
    });
    return () => {
      active = false;
    };
  }, [session.user.id]);

  if (check === 'admin') return <Dashboard />;
  return (
    <CenteredCard>
      <p className="m-0 text-(--adm-muted)">
        {check === 'checking'
          ? 'Verificando acesso…'
          : `O usuário ${session.user.email ?? ''} não tem permissão de administrador.`}
      </p>
      {check === 'denied' && (
        <button
          type="button"
          onClick={() => void supabase?.auth.signOut()}
          className={cn(BTN_PRIMARY, 'mt-4 h-[50px] w-full')}
        >
          SAIR
        </button>
      )}
    </CenteredCard>
  );
}

export function AdminPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setReady(true);
    });
    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => setSession(nextSession));
    return () => data.subscription.unsubscribe();
  }, []);

  if (!supabase) {
    return (
      <CenteredCard>
        <h1 className="m-0 font-display text-[28px] font-normal uppercase">Supabase não configurado</h1>
        <p className="mt-3 mb-0 text-(--adm-muted)">
          Defina <code>VITE_SUPABASE_URL</code> e <code>VITE_SUPABASE_ANON_KEY</code> no <code>.env</code> (ou nas
          variáveis de ambiente da hospedagem) e publique o site de novo.
        </p>
      </CenteredCard>
    );
  }
  if (!ready) return <div className="min-h-screen bg-(--adm-page)" />;
  return session ? <AdminGate session={session} /> : <LoginForm />;
}
