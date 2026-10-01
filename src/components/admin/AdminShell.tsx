import { Check, LogOut } from 'lucide-react';
import { useEffect, useState, type ReactNode } from 'react';
import { Link } from 'react-router';
import { ROUTES } from '../../routes';
import { ThemeToggle } from '../layout/ThemeToggle/ThemeToggle';
import type { StoreStatusOverride } from '../../types/store';
import { cn } from '../../utils/cn';
import { TABS, type AdminTab } from './adminTabs';
import { PrinterStatusButton } from './PrinterControls';
import { SoundStatusButton } from './SoundControls';
import type { Toast } from './useAdminData';
import { useStoreStatusText } from './useStoreStatusText';

function Logo({ small }: { small?: boolean }) {
  return (
    <span
      className={cn(
        'block flex-none -rotate-4 rounded-md bg-(--adm-accent) font-display leading-none text-white',
        small ? 'px-[7px] pt-1 pb-[3px] text-base' : 'px-2 pt-1 pb-[3px] text-[19px]',
      )}
    >
      S.O.S
    </span>
  );
}

function ToastView({ toast }: { toast: Toast | null }) {
  const [hiddenId, setHiddenId] = useState<number | null>(null);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setHiddenId(toast.id), toast.tone === 'error' ? 5000 : 2400);
    return () => clearTimeout(timer);
  }, [toast]);

  const show = !!toast && hiddenId !== toast.id;
  return (
    <div
      role={toast?.tone === 'error' ? 'alert' : 'status'}
      aria-live="polite"
      className={cn(
        'pointer-events-none fixed bottom-[88px] left-1/2 z-80 flex max-w-[calc(100vw-24px)] -translate-x-1/2 items-center gap-2.5 rounded-xl px-[18px] py-3 text-sm font-bold text-white shadow-[0_14px_34px_-12px_rgba(0,0,0,.5)] transition-[translate,opacity] duration-300 min-[960px]:bottom-7',
        toast?.tone === 'error' ? 'bg-[#b3261e]' : 'bg-(--adm-chrome) ring-1 ring-(--adm-chrome-line)',
        show ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0',
      )}
    >
      {toast && (
        <>
          <span
            className={cn(
              'grid size-5 flex-none place-items-center rounded-full text-xs',
              toast.tone === 'error' ? 'bg-white/25' : 'bg-[#178a45]',
            )}
          >
            {toast.tone === 'error' ? '!' : <Check size={12} strokeWidth={3} aria-hidden="true" />}
          </span>
          {toast.text}
        </>
      )}
    </div>
  );
}

interface AdminShellProps {
  tab: AdminTab;
  onTab: (tab: AdminTab) => void;
  newOrders: number;
  livePromos: number;
  statusOverride: StoreStatusOverride;
  savedAt: Date | null;
  toast: Toast | null;
  onSignOut: () => void;
  children: ReactNode;
}

export function AdminShell({
  tab,
  onTab,
  newOrders,
  livePromos,
  statusOverride,
  savedAt,
  toast,
  onSignOut,
  children,
}: AdminShellProps) {
  const status = useStoreStatusText(statusOverride);
  const title = TABS.find((item) => item.id === tab)?.title ?? '';
  const savedLabel = savedAt
    ? `Salvo às ${String(savedAt.getHours()).padStart(2, '0')}:${String(savedAt.getMinutes()).padStart(2, '0')}`
    : 'Tudo salvo';
  const countFor = (id: AdminTab) => (id === 'orders' ? newOrders : id === 'promos' ? livePromos : 0);

  return (
    <div className="flex min-h-screen bg-(--adm-page) font-sans text-[15px] leading-normal text-(--adm-ink) antialiased">
      <title>{`${newOrders ? `(${newOrders}) ` : ''}${title} — Painel S.O.S`}</title>
      <meta name="robots" content="noindex, nofollow" />

      <aside className="sticky top-0 hidden h-screen w-[248px] flex-none flex-col border-r border-(--adm-chrome-line) bg-(--adm-chrome) px-4 py-[22px] text-[#f4efe7] min-[960px]:flex">
        <div className="flex items-center gap-2.5 px-2">
          <Logo />
          <span className="flex flex-col leading-[1.1]">
            <span className="font-display text-[15px] tracking-[.05em]">DELIVERY</span>
            <span className="text-[11px] font-bold tracking-[.1em] text-[#a89986]">PAINEL DO LOJISTA</span>
          </span>
        </div>
        <nav aria-label="Painel" className="mt-8 flex flex-col gap-1">
          {TABS.map((item) => {
            const on = item.id === tab;
            const count = countFor(item.id);
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onTab(item.id)}
                aria-current={on ? 'page' : undefined}
                className={cn(
                  'flex h-[46px] cursor-pointer items-center justify-between rounded-[10px] px-3.5 text-left text-[15px] font-bold transition-colors duration-200 hover:bg-[rgba(244,239,231,.08)]',
                  on ? 'bg-[rgba(244,239,231,.12)] text-white' : 'text-[#bfb2a1]',
                )}
              >
                {item.label}
                {count > 0 && (
                  <span
                    className={cn(
                      'rounded-full px-2 py-px text-xs font-extrabold',
                      item.id === 'orders' ? 'bg-(--adm-accent)' : 'bg-[rgba(244,239,231,.12)]',
                    )}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
        <div className="mt-auto flex flex-col gap-2.5">
          <div className="rounded-xl bg-[rgba(244,239,231,.06)] p-3.5 text-[13px]">
            <div className="flex items-center gap-2 font-extrabold">
              <span className={cn('size-[9px] rounded-full', status.isOpen ? 'bg-[#34c759]' : 'bg-[#ff5a4a]')} />
              {status.title}
            </div>
            <div className="mt-0.5 text-[#a89986]">{status.subtitle}</div>
          </div>
          <div className="flex gap-2">
            <Link
              to={ROUTES.home}
              target="_blank"
              className="flex h-11 flex-1 items-center justify-center rounded-[10px] border border-[rgba(244,239,231,.18)] text-sm font-bold text-[#f4efe7] hover:opacity-85"
            >
              Ver site ↗
            </Link>
            <ThemeToggle variant="sidebar" />
          </div>
          <button
            type="button"
            onClick={onSignOut}
            className="flex h-9 cursor-pointer items-center justify-center gap-2 text-[13px] font-bold text-[#a89986] hover:text-[#f4efe7]"
          >
            <LogOut size={14} aria-hidden="true" /> Sair
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 border-b border-(--adm-line) bg-(--adm-header) backdrop-blur-md">
          <div className="mx-auto flex h-[60px] max-w-[1120px] items-center justify-between gap-3 px-[clamp(16px,3vw,32px)] min-[960px]:h-[72px]">
            <div className="flex min-w-0 items-center gap-3">
              <span className="min-[960px]:hidden">
                <Logo small />
              </span>
              <h1 className="m-0 truncate font-display text-[clamp(24px,3vw,32px)] leading-[1.3] font-normal uppercase">
                {title}
              </h1>
            </div>
            <div className="flex items-center gap-2.5">
              <span className="flex items-center gap-1.5 text-[13px] font-semibold whitespace-nowrap text-(--adm-muted) max-[419px]:hidden">
                <span className="size-[7px] rounded-full bg-[#178a45]" />
                {savedLabel}
              </span>
              <PrinterStatusButton
                onOpenSettings={() => {
                  onTab('store');
                  setTimeout(() => document.getElementById('impressora')?.scrollIntoView({ behavior: 'smooth' }), 50);
                }}
              />
              <SoundStatusButton />
              <ThemeToggle className="min-[960px]:hidden" />
              <Link
                to={ROUTES.home}
                target="_blank"
                className="flex h-10 items-center rounded-[10px] border border-(--adm-line) bg-(--adm-card) px-3.5 text-[13px] font-bold whitespace-nowrap text-(--adm-ink) min-[960px]:hidden"
              >
                Site ↗
              </Link>
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1120px] flex-1 px-[clamp(16px,3vw,32px)] pt-[clamp(20px,3vw,32px)] pb-[104px] min-[960px]:pb-12">
          {children}
        </main>
      </div>

      <nav
        aria-label="Painel"
        className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-(--adm-chrome-line) bg-(--adm-chrome) px-1.5 pt-1.5 pb-[calc(6px+env(safe-area-inset-bottom))] min-[960px]:hidden"
      >
        {TABS.map((item) => {
          const on = item.id === tab;
          const alert = item.id === 'orders' ? newOrders : 0;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onTab(item.id)}
              aria-current={on ? 'page' : undefined}
              className={cn(
                'relative flex h-14 cursor-pointer flex-col items-center justify-center gap-1 rounded-[10px] text-xs font-bold',
                on ? 'bg-[rgba(244,239,231,.12)] text-white' : 'text-[#bfb2a1]',
              )}
            >
              <span className={cn('size-1.5 rounded-full', on ? 'bg-[#f2b53a]' : 'bg-transparent')} />
              {item.short}
              {alert > 0 && (
                <span className="absolute top-1.5 right-[calc(50%-26px)] grid h-[18px] min-w-[18px] place-items-center rounded-full bg-(--adm-accent) px-[5px] text-[11px] font-extrabold text-white">
                  {alert}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      <ToastView toast={toast} />
    </div>
  );
}
