import { useEffect } from 'react';
import { create } from 'zustand';
import { fetchAgentHealth, fetchAgentPrinters, type AgentHealth, type AgentPrinter } from './printAgent';

const AUTO_PRINT_KEY = 'admin_auto_print';
/** De quanto em quanto tempo o painel pergunta ao agente se a impressora está ok. */
const POLL_ONLINE_MS = 10_000;
const POLL_OFFLINE_MS = 20_000;

function readAutoPrint(): boolean {
  try {
    return localStorage.getItem(AUTO_PRINT_KEY) !== 'off';
  } catch {
    return true;
  }
}

interface PrinterState {
  /** Imprimir a comanda ao aceitar o pedido (preferência deste aparelho). */
  autoPrint: boolean;
  /** `checking` só até a primeira resposta. */
  agent: 'checking' | 'online' | 'offline';
  health: AgentHealth | null;
  /** Impressoras instaladas no Windows (para escolher nas configurações). */
  printers: AgentPrinter[];
  setAutoPrint: (autoPrint: boolean) => void;
  refresh: () => Promise<void>;
  loadPrinters: () => Promise<void>;
}

export const usePrinterStore = create<PrinterState>((set) => ({
  autoPrint: readAutoPrint(),
  agent: 'checking',
  health: null,
  printers: [],
  setAutoPrint: (autoPrint) => {
    try {
      localStorage.setItem(AUTO_PRINT_KEY, autoPrint ? 'on' : 'off');
    } catch {
      // Sem localStorage: vale só nesta visita.
    }
    set({ autoPrint });
  },
  refresh: async () => {
    const health = await fetchAgentHealth();
    set({ health, agent: health ? 'online' : 'offline' });
  },
  loadPrinters: async () => {
    const printers = await fetchAgentPrinters().catch(() => []);
    set({ printers });
  },
}));

/** Impressora pronta para imprimir (agente aberto e impressora ligada). */
export function isPrinterReady(state: Pick<PrinterState, 'agent' | 'health'>): boolean {
  return state.agent === 'online' && state.health?.printer === 'connected';
}

/** Mantém o status da impressora atualizado enquanto o painel está aberto. */
export function usePrinterHealthPolling() {
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    let active = true;
    const tick = async () => {
      await usePrinterStore.getState().refresh();
      if (!active) return;
      timer = setTimeout(tick, usePrinterStore.getState().agent === 'online' ? POLL_ONLINE_MS : POLL_OFFLINE_MS);
    };
    void tick();
    const onFocus = () => void usePrinterStore.getState().refresh();
    window.addEventListener('focus', onFocus);
    return () => {
      active = false;
      clearTimeout(timer);
      window.removeEventListener('focus', onFocus);
    };
  }, []);
}
