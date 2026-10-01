import { storeConfig } from '../../data/storeConfig';
import type { AdminOrder, OrderType, PaymentMethod } from '../../types/order';

/**
 * Conversa com o agente de impressão instalado no computador da loja
 * (`printer-agent/`). O navegador não fala com a impressora USB: ele manda os
 * dados do pedido para o agente, que monta a comanda em ESC/POS e imprime.
 * O agente só atende o próprio computador e só aceita este site.
 */
export const PRINT_AGENT_URL = 'http://127.0.0.1:3333';

/** O agente espera até 15 s a impressora confirmar; aqui damos folga para o Windows. */
const PRINT_TIMEOUT_MS = 45_000;
const STATUS_TIMEOUT_MS = 8_000;

export type PrinterConnection = 'connected' | 'disconnected' | 'not_found' | 'not_configured';

/** Resposta de GET /health. */
export interface AgentHealth {
  status: 'ok';
  version: string;
  printer: PrinterConnection;
  printerName: string;
  autoDetected: boolean;
  code: string | null;
  message: string;
  windowsStatus: string;
  paperWidthMm: number;
  columns: number;
  codepage: AgentCodepage;
  simulated: boolean;
}

export type AgentCodepage = 'cp850' | 'cp860' | 'wpc1252' | 'ascii';

export const CODEPAGE_OPTIONS: { id: AgentCodepage; label: string }[] = [
  { id: 'cp850', label: 'PC850 (padrão)' },
  { id: 'cp860', label: 'PC860 (português)' },
  { id: 'wpc1252', label: 'Windows-1252' },
  { id: 'ascii', label: 'Sem acentos' },
];

export interface AgentPrinter {
  name: string;
  driver: string;
  port: string;
  ready: boolean;
  status: string;
}

export type PrintResult =
  | { ok: true; alreadyPrinted: boolean }
  | { ok: false; code: string; message: string };

/** Comanda enviada em POST /print (o agente confere cada campo). */
export interface OrderTicket {
  store: string;
  orderId: number;
  createdAt: number;
  acceptedAt: number | null;
  orderType: OrderType;
  customerName: string;
  customerPhone: string;
  items: { quantity: number; name: string; addons: string[]; note: string }[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  paymentMethod: PaymentMethod;
  changeFor: string;
  address: string;
  reference: string;
  city: string;
  notes: string;
}

const AGENT_OFFLINE_MESSAGE =
  'Agente de impressão não conectado. Abra o sos-impressora.exe neste computador (e permita o acesso à rede local se o Chrome perguntar).';

/** Mensagens para os erros que acontecem antes de chegar na impressora. */
const CLIENT_ERRORS: Record<string, string> = {
  AGENT_OFFLINE: AGENT_OFFLINE_MESSAGE,
  AGENT_TIMEOUT: 'O agente de impressão não respondeu a tempo. Confira a impressora e tente de novo.',
  FORBIDDEN_ORIGIN: 'O agente recusou este endereço do painel. Inclua-o em "allowedOrigins" no config.json do agente.',
  RATE_LIMITED: 'Muitas impressões seguidas. Aguarde um minuto.',
};

class AgentUnavailable extends Error {
  readonly code: 'AGENT_OFFLINE' | 'AGENT_TIMEOUT';

  constructor(code: 'AGENT_OFFLINE' | 'AGENT_TIMEOUT') {
    super(CLIENT_ERRORS[code]);
    this.code = code;
  }
}

async function callAgent<T>(path: string, init: { body?: unknown; timeoutMs: number }): Promise<{ status: number; body: T }> {
  let response: Response;
  try {
    response = await fetch(`${PRINT_AGENT_URL}${path}`, {
      method: init.body === undefined ? 'GET' : 'POST',
      headers: init.body === undefined ? undefined : { 'Content-Type': 'application/json' },
      body: init.body === undefined ? undefined : JSON.stringify(init.body),
      cache: 'no-store',
      signal: AbortSignal.timeout(init.timeoutMs),
    });
  } catch (error) {
    // Agente fechado, porta errada ou o Chrome bloqueou o acesso à rede local.
    throw new AgentUnavailable(error instanceof DOMException && error.name === 'TimeoutError' ? 'AGENT_TIMEOUT' : 'AGENT_OFFLINE');
  }
  const body = (await response.json().catch(() => ({}))) as T;
  return { status: response.status, body };
}

function failure(error: unknown): PrintResult {
  if (error instanceof AgentUnavailable) return { ok: false, code: error.code, message: error.message };
  return { ok: false, code: 'AGENT_ERROR', message: error instanceof Error ? error.message : 'Erro inesperado.' };
}

function toResult(body: Partial<PrintResult> & { code?: string; message?: string; alreadyPrinted?: boolean }): PrintResult {
  if (body.ok === true) return { ok: true, alreadyPrinted: body.alreadyPrinted === true };
  const code = body.code ?? 'AGENT_ERROR';
  return { ok: false, code, message: CLIENT_ERRORS[code] ?? body.message ?? 'O agente não conseguiu imprimir.' };
}

/** `null` = agente fora do ar (ou bloqueado pelo navegador). */
export async function fetchAgentHealth(): Promise<AgentHealth | null> {
  try {
    const { status, body } = await callAgent<AgentHealth>('/health', { timeoutMs: STATUS_TIMEOUT_MS });
    return status === 200 && body.status === 'ok' ? body : null;
  } catch {
    return null;
  }
}

export async function fetchAgentPrinters(): Promise<AgentPrinter[]> {
  const { body } = await callAgent<{ printers?: AgentPrinter[] }>('/printers', { timeoutMs: STATUS_TIMEOUT_MS });
  return body.printers ?? [];
}

/** Troca a impressora ou a tabela de acentos no agente. Devolve a mensagem de erro, se houver. */
export async function saveAgentConfig(patch: { printerName?: string; codepage?: AgentCodepage }): Promise<string | null> {
  try {
    const { status, body } = await callAgent<{ message?: string }>('/config', { body: patch, timeoutMs: STATUS_TIMEOUT_MS });
    return status === 200 ? null : (body.message ?? 'O agente recusou a configuração.');
  } catch (error) {
    return error instanceof Error ? error.message : 'Erro inesperado.';
  }
}

export async function printTestPage(): Promise<PrintResult> {
  try {
    const { body } = await callAgent<PrintResult>('/test', { body: {}, timeoutMs: PRINT_TIMEOUT_MS });
    return toResult(body);
  } catch (error) {
    return failure(error);
  }
}

/** Dados do pedido no formato da comanda (limitados aos tamanhos que o agente aceita). */
export function ticketFromOrder(order: AdminOrder): OrderTicket {
  const acceptedAt = [...order.history].reverse().find((entry) => entry.s === 'aceito')?.at;
  return {
    store: storeConfig.name,
    orderId: order.id,
    createdAt: Math.round(order.createdAt),
    acceptedAt: acceptedAt ? Math.round(acceptedAt) : null,
    orderType: order.orderType,
    customerName: order.customerName.slice(0, 80),
    customerPhone: order.customerPhone.slice(0, 20),
    items: order.items.slice(0, 50).map((item) => ({
      quantity: Math.min(99, Math.max(1, Math.round(item.quantity))),
      name: item.name.slice(0, 80),
      addons: (item.addons ?? []).slice(0, 30).map((addon) => addon.slice(0, 60)),
      note: (item.note ?? '').slice(0, 200),
    })),
    subtotal: order.subtotal,
    deliveryFee: order.deliveryFee,
    total: order.total,
    paymentMethod: order.paymentMethod,
    changeFor: order.changeFor.slice(0, 20),
    address: order.address.slice(0, 200),
    reference: order.reference.slice(0, 120),
    city: `${storeConfig.city} - ${storeConfig.state}`,
    notes: order.notes.slice(0, 300),
  };
}

/** Manda a comanda para o agente. `reprint` = segunda via pedida pelo lojista. */
export async function printOrderTicket(order: AdminOrder, reprint: boolean): Promise<PrintResult> {
  try {
    const { body } = await callAgent<PrintResult>('/print', {
      body: { orderId: order.id, reprint, ticket: ticketFromOrder(order) },
      timeoutMs: PRINT_TIMEOUT_MS,
    });
    return toResult(body);
  } catch (error) {
    return failure(error);
  }
}
