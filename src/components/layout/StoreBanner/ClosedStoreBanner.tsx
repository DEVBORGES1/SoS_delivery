import { useStoreStatus } from '../../../hooks/useStoreStatus';

export function ClosedStoreBanner() {
  const { isOpen, labels } = useStoreStatus();
  if (isOpen) return null;

  return (
    <div role="status" className="bg-accent px-gutter py-3 text-center text-sm font-semibold text-pretty text-white">
      Estamos fechados agora — abrimos {labels.nextOpening}. Você já pode montar seu pedido.
    </div>
  );
}
