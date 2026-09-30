import { useStoreStatus } from '../../hooks/useStoreStatus';
import type { StoreStatusOverride } from '../../types/store';

/** Texto do status da loja usado na barra lateral e na Visão geral. */
export function useStoreStatusText(override: StoreStatusOverride) {
  const { isOpen } = useStoreStatus();
  return {
    isOpen,
    title: isOpen ? 'Loja aberta' : 'Loja fechada',
    subtitle:
      override === 'auto'
        ? 'Automático · seguindo o horário de funcionamento'
        : override === 'open'
          ? 'Aberta manualmente — lembre de voltar ao automático'
          : 'Fechada manualmente — o site não aceita envio de pedidos',
  };
}
