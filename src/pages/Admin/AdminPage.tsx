import type { Session } from '@supabase/supabase-js';
import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { Link } from 'react-router';
import { FeedbackMessage, type Feedback } from '../../components/admin/adminUi';
import { ProductsEditor } from '../../components/admin/ProductsEditor';
import { SettingsEditor } from '../../components/admin/SettingsEditor';
import { Button } from '../../components/ui/Button/Button';
import { TextField } from '../../components/ui/Input/TextField';
import { LogoMark } from '../../components/ui/Logo/Logo';
import { storeConfig } from '../../data/storeConfig';
import { ROUTES } from '../../routes';
import { describeError, supabase } from '../../services/supabaseClient';
import { cn } from '../../utils/cn';

type Tab = 'loja' | 'cardapio';
type AdminCheck = 'checking' | 'admin' | 'denied';

function AdminShell({ children, onSignOut }: { children: ReactNode; onSignOut?: () => void }) {
  return (
    <div className="min-h-screen bg-bg">
      <title>{`Painel — ${storeConfig.name}`}</title>
      <meta name="robots" content="noindex, nofollow" />
      <header className="border-b border-line bg-header px-gutter py-3 backdrop-blur-md">
        <div className="mx-auto flex max-w-[960px] items-center justify-between gap-3">
          <Link to={ROUTES.home} className="flex items-center gap-2.5" aria-label="Ver o site">
            <LogoMark />
            <span className="font-display text-lg tracking-[.06em]">PAINEL</span>
          </Link>
          {onSignOut && (
            <Button variant="ghost" size="xs" onClick={onSignOut} className="h-auto px-0">
              Sair
            </Button>
          )}
        </div>
      </header>
      <main className="mx-auto max-w-[960px] px-gutter py-[clamp(20px,4vw,40px)]">{children}</main>
    </div>
  );
}

function NotConfigured() {
  return (
    <AdminShell>
      <div className="rounded-sheet border border-line bg-surface p-6">
        <h1 className="font-display text-3xl uppercase">Supabase não configurado</h1>
        <p className="mt-3 text-muted">
          Defina <code>VITE_SUPABASE_URL</code> e <code>VITE_SUPABASE_ANON_KEY</code> no arquivo <code>.env</code> (ou
          nas variáveis de ambiente da hospedagem) e publique o site de novo. O passo a passo está no README.
        </p>
      </div>
    </AdminShell>
  );
}

function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>(null);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!supabase) return;
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setLoading(false);
    if (error) setFeedback({ tone: 'error', message: describeError(error) });
  };

  return (
    <AdminShell>
      <form onSubmit={submit} className="mx-auto flex max-w-[420px] flex-col gap-4 rounded-sheet border border-line bg-surface p-6">
        <h1 className="font-display text-[34px] leading-none uppercase">Entrar no painel</h1>
        <TextField
          id="admin-email"
          label="E-mail"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
        <TextField
          id="admin-password"
          label="Senha"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
        <FeedbackMessage feedback={feedback} />
        <Button type="submit" size="md" shape="soft" disabled={loading}>
          {loading ? 'ENTRANDO…' : 'ENTRAR'}
        </Button>
      </form>
    </AdminShell>
  );
}

function Dashboard({ session }: { session: Session }) {
  const [tab, setTab] = useState<Tab>('loja');
  const [adminCheck, setAdminCheck] = useState<AdminCheck>('checking');

  useEffect(() => {
    let active = true;
    supabase?.rpc('is_admin').then(({ data, error }) => {
      if (active) setAdminCheck(!error && data === true ? 'admin' : 'denied');
    });
    return () => {
      active = false;
    };
  }, [session.user.id]);

  const signOut = () => void supabase?.auth.signOut();

  if (adminCheck !== 'admin') {
    return (
      <AdminShell onSignOut={signOut}>
        <p className="py-10 text-center text-muted">
          {adminCheck === 'checking'
            ? 'Verificando acesso…'
            : `O usuário ${session.user.email ?? ''} não tem permissão de administrador.`}
        </p>
      </AdminShell>
    );
  }

  return (
    <AdminShell onSignOut={signOut}>
      <h1 className="sr-only">Painel da loja</h1>
      <div role="tablist" aria-label="Seções do painel" className="mb-5 flex gap-2">
        {(
          [
            ['loja', 'Loja e horários'],
            ['cardapio', 'Cardápio'],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            role="tab"
            id={`tab-${id}`}
            aria-selected={tab === id}
            aria-controls={`panel-${id}`}
            onClick={() => setTab(id)}
            className={cn(
              'h-11 rounded-full border-[1.5px] px-5 text-[15px] font-bold transition-colors duration-200',
              tab === id ? 'border-accent bg-accent text-accent-ink' : 'border-line hover:bg-line',
            )}
          >
            {label}
          </button>
        ))}
      </div>
      <div role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`}>
        {tab === 'loja' ? <SettingsEditor /> : <ProductsEditor />}
      </div>
    </AdminShell>
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

  if (!supabase) return <NotConfigured />;
  if (!ready) return <AdminShell>{null}</AdminShell>;
  return session ? <Dashboard session={session} /> : <LoginForm />;
}
