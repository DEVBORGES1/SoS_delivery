import { LoaderCircle, Printer, RefreshCw, TriangleAlert } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { AdminOrder } from '../../types/order';
import { cn } from '../../utils/cn';
import { formatClockTime } from './adminFormat';
import { BTN_OUTLINE, CARD, CARD_PAD, EYEBROW, INPUT, MUTED, Switch } from './adminUi';
import {
  CODEPAGE_OPTIONS,
  printTestPage,
  saveAgentConfig,
  type AgentCodepage,
} from './printAgent';
import { isPrinterReady, usePrinterStore } from './printerStore';

/** Reserva de impressão parada há mais que isso: a aba que imprimia provavelmente fechou. */
const STALE_PRINT_MS = 2 * 60_000;

/** Texto do status: "Online · POS-58" ou o motivo de estar desconectada. */
function usePrinterStatusText() {
  const { agent, health } = usePrinterStore();
  const ready = isPrinterReady({ agent, health });
  if (agent === 'checking') return { ready, tone: 'muted' as const, title: 'Verificando…', detail: 'Procurando o agente de impressão.' };
  if (agent === 'offline' || !health) {
    return {
      ready,
      tone: 'bad' as const,
      title: 'Agente desconectado',
      detail: 'Abra o sos-impressora.exe neste computador.',
    };
  }
  if (ready) {
    return {
      ready,
      tone: 'good' as const,
      title: 'Online',
      detail: `Impressora térmica ${health.paperWidthMm}mm · ${health.printerName}${
        health.simulated && !/simula/i.test(health.printerName) ? ' (simulação)' : ''
      }`,
    };
  }
  return {
    ready,
    tone: 'bad' as const,
    title: 'Offline',
    detail: health.printer === 'disconnected' ? `${health.message} Verifique a conexão USB.` : health.message,
  };
}

const DOT = { good: 'bg-[#34c759]', bad: 'bg-[#ff5a4a]', muted: 'bg-(--adm-subtle)' };

/** Indicador no cabeçalho do painel. Leva às configurações da impressora. */
export function PrinterStatusButton({ onOpenSettings }: { onOpenSettings: () => void }) {
  const status = usePrinterStatusText();
  const label = status.tone === 'good' ? 'Impressora online' : status.tone === 'bad' ? 'Impressora offline' : 'Impressora';
  return (
    <button
      type="button"
      onClick={onOpenSettings}
      title={`${status.title}: ${status.detail}`}
      aria-label={`${label}. ${status.detail} Toque para ver as configurações da impressora`}
      className="flex h-10 flex-none cursor-pointer items-center gap-1.5 rounded-[10px] border border-(--adm-line) bg-(--adm-card) px-3 text-[13px] font-bold whitespace-nowrap text-(--adm-ink)"
    >
      <span className="relative">
        <Printer size={16} aria-hidden="true" />
        <span className={cn('absolute -right-1 -bottom-0.5 size-2 rounded-full ring-2 ring-(--adm-card)', DOT[status.tone])} />
      </span>
      <span className="max-[599px]:hidden">{label}</span>
    </button>
  );
}

/** Configurações → Impressora. */
export function PrinterSettings({ notify }: { notify: (text: string, tone?: 'success' | 'error') => void }) {
  const { autoPrint, setAutoPrint, agent, health, printers, refresh, loadPrinters } = usePrinterStore();
  const status = usePrinterStatusText();
  const [busy, setBusy] = useState<'test' | 'config' | 'refresh' | null>(null);
  const online = agent === 'online' && !!health;

  useEffect(() => {
    if (online) void loadPrinters();
  }, [online, loadPrinters]);

  const configure = async (patch: { printerName?: string; codepage?: AgentCodepage }, text: string) => {
    setBusy('config');
    const error = await saveAgentConfig(patch);
    await refresh();
    setBusy(null);
    notify(error ?? text, error ? 'error' : 'success');
  };

  const test = async () => {
    setBusy('test');
    const result = await printTestPage();
    await refresh();
    setBusy(null);
    notify(result.ok ? 'Página de teste impressa. Confira os acentos no papel.' : `Não foi possível imprimir o teste. ${result.message}`, result.ok ? 'success' : 'error');
  };

  const reload = async () => {
    setBusy('refresh');
    await refresh();
    if (usePrinterStore.getState().agent === 'online') await loadPrinters();
    setBusy(null);
  };

  // "Automática" mostra qual impressora o agente achou sozinho.
  const selected = health && !health.autoDetected ? health.printerName : '';
  const hasSelected = !selected || printers.some((printer) => printer.name === selected);

  return (
    <section id="impressora" className={cn(CARD, CARD_PAD, 'flex flex-col gap-4 scroll-mt-24')}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="m-0 text-[17px] font-extrabold">Impressora</h2>
          <p className={cn('mt-1 mb-0 text-[13px]', MUTED)}>Comanda impressa na térmica da loja quando o pedido é aceito.</p>
        </div>
        <button type="button" onClick={() => void reload()} disabled={busy !== null} className={BTN_OUTLINE}>
          <RefreshCw size={15} aria-hidden="true" className={cn(busy === 'refresh' && 'animate-spin')} />
          Atualizar
        </button>
      </div>

      <div role="status" className="flex items-start gap-3 rounded-2xl bg-(--adm-soft) px-4 py-3">
        <span className={cn('mt-1.5 size-2.5 flex-none rounded-full', DOT[status.tone])} />
        <div className="min-w-0">
          <div className="font-extrabold">{status.title}</div>
          <div className={cn('text-[13px]', MUTED)}>{status.detail}</div>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="font-bold">Impressão automática</div>
          <div className={cn('text-[13px]', MUTED)}>
            {autoPrint
              ? 'Ligada: ao aceitar um pedido, a comanda sai na hora.'
              : 'Desligada: aceite normalmente e imprima pelo botão "Imprimir comanda" do pedido.'}{' '}
            Vale só para este aparelho.
          </div>
        </div>
        <Switch label="Impressão automática" checked={autoPrint} onChange={setAutoPrint} />
      </div>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,220px),1fr))] gap-3 border-t border-(--adm-divider) pt-4">
        <label className="flex min-w-0 flex-col gap-1.5">
          <span className="text-sm font-bold">Impressora selecionada</span>
          <select
            value={hasSelected ? selected : ''}
            disabled={!online || busy !== null}
            onChange={(event) =>
              void configure(
                { printerName: event.target.value },
                event.target.value ? `Impressora: ${event.target.value}` : 'Impressora: escolha automática',
              )
            }
            className={cn(INPUT, 'cursor-pointer disabled:cursor-not-allowed disabled:opacity-60')}
          >
            <option value="">
              Automática{health?.autoDetected && health.printerName ? ` (${health.printerName})` : ''}
            </option>
            {printers.map((printer) => (
              <option key={printer.name} value={printer.name}>
                {printer.name}
                {printer.ready ? '' : ` — ${printer.status}`}
              </option>
            ))}
          </select>
        </label>
        <label className="flex min-w-0 flex-col gap-1.5">
          <span className="text-sm font-bold">Tabela de acentos</span>
          <select
            value={health?.codepage ?? 'cp850'}
            disabled={!online || busy !== null}
            onChange={(event) => {
              const codepage = event.target.value as AgentCodepage;
              const label = CODEPAGE_OPTIONS.find((option) => option.id === codepage)?.label ?? codepage;
              void configure({ codepage }, `Tabela de acentos: ${label}. Imprima um teste para conferir.`);
            }}
            className={cn(INPUT, 'cursor-pointer disabled:cursor-not-allowed disabled:opacity-60')}
          >
            {CODEPAGE_OPTIONS.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <dl className="m-0 grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
        <dt className={MUTED}>Largura do papel</dt>
        <dd className="m-0 font-bold">{health ? `${health.paperWidthMm}mm (${health.columns} colunas)` : '58mm'}</dd>
        <dt className={MUTED}>Agente local</dt>
        <dd className="m-0 font-bold">{online ? `Conectado · v${health.version}` : agent === 'checking' ? 'Verificando…' : 'Desconectado'}</dd>
      </dl>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-(--adm-divider) pt-4">
        <span className={cn('max-w-[420px] text-[12.5px]', MUTED)}>
          Primeira vez neste computador? Se o Chrome perguntar se o site pode acessar dispositivos da rede local, clique em
          Permitir.
        </span>
        <button type="button" onClick={() => void test()} disabled={!online || busy !== null} className={BTN_OUTLINE}>
          {busy === 'test' ? <LoaderCircle size={15} aria-hidden="true" className="animate-spin" /> : <Printer size={15} aria-hidden="true" />}
          Imprimir teste
        </button>
      </div>
    </section>
  );
}

interface OrderPrintPanelProps {
  order: AdminOrder;
  /** Esta aba está mandando a comanda agora. */
  sending: boolean;
  now: number;
  onPrint: (reprint: boolean) => void;
}

/** Situação da comanda no detalhe do pedido: enviando, impressa, falhou ou não impressa. */
export function OrderPrintPanel({ order, sending, now, onPrint }: OrderPrintPanelProps) {
  const [confirmReprint, setConfirmReprint] = useState(false);
  const stale =
    order.printStatus === 'printing' && !sending && now - (order.printUpdatedAt ?? order.createdAt) > STALE_PRINT_MS;
  const state: 'sending' | 'stale' | 'printed' | 'failed' | 'none' =
    sending || order.printStatus === 'printing' ? (stale ? 'stale' : 'sending') : order.printStatus;

  const title = order.status === 'aceito' ? 'Pedido aceito' : 'Comanda';
  const content = {
    sending: { icon: <LoaderCircle size={18} aria-hidden="true" className="animate-spin" />, tone: 'text-(--adm-ink)', text: 'Enviando para impressão…' },
    printed: {
      icon: <Printer size={18} aria-hidden="true" />,
      tone: 'text-(--adm-green-text)',
      text: `Comanda impressa com sucesso${order.printedAt ? ` às ${formatClockTime(order.printedAt)}` : ''}.`,
    },
    failed: { icon: <TriangleAlert size={18} aria-hidden="true" />, tone: 'text-(--adm-danger)', text: 'Não foi possível imprimir.' },
    stale: {
      icon: <TriangleAlert size={18} aria-hidden="true" />,
      tone: 'text-(--adm-danger)',
      text: 'Impressão não confirmada. Confira se a comanda saiu antes de tentar de novo.',
    },
    none: { icon: <Printer size={18} aria-hidden="true" />, tone: 'text-(--adm-muted)', text: 'Comanda ainda não impressa.' },
  }[state];

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        'flex flex-wrap items-center justify-between gap-3 rounded-[14px] border px-4 py-3',
        state === 'failed' || state === 'stale' ? 'border-(--adm-danger) bg-(--adm-card)' : 'border-(--adm-divider) bg-(--adm-soft)',
      )}
    >
      <div className="min-w-0 flex-1">
        <div className={EYEBROW}>{title.toUpperCase()}</div>
        <div className={cn('mt-1 flex items-center gap-2 text-[15px] font-extrabold', content.tone)}>
          {content.icon}
          {content.text}
        </div>
        {state === 'failed' && order.printError && (
          <div className="mt-0.5 text-[13px] font-semibold text-(--adm-danger)">Motivo: {order.printError}</div>
        )}
      </div>
      {(state === 'failed' || state === 'stale') && (
        <button
          type="button"
          onClick={() => onPrint(false)}
          className="flex h-11 cursor-pointer items-center gap-2 rounded-[10px] bg-(--adm-accent) px-4 text-sm font-extrabold tracking-[.03em] text-white hover:brightness-110"
        >
          <RefreshCw size={16} aria-hidden="true" />
          TENTAR NOVAMENTE
        </button>
      )}
      {state === 'none' && (
        <button type="button" onClick={() => onPrint(false)} className={BTN_OUTLINE}>
          <Printer size={15} aria-hidden="true" />
          Imprimir comanda
        </button>
      )}
      {state === 'printed' && (
        <button
          type="button"
          onClick={() => {
            if (!confirmReprint) {
              setConfirmReprint(true);
              setTimeout(() => setConfirmReprint(false), 4000);
              return;
            }
            setConfirmReprint(false);
            onPrint(true);
          }}
          className={cn(BTN_OUTLINE, confirmReprint && 'border-(--adm-accent) text-(--adm-accent)')}
        >
          <Printer size={15} aria-hidden="true" />
          {confirmReprint ? 'Confirmar 2ª via' : 'Reimprimir'}
        </button>
      )}
    </div>
  );
}
