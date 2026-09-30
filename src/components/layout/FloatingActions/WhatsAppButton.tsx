import { MessageCircle } from 'lucide-react';
import { useCart } from '../../../hooks/useCart';
import { useStoreSettings } from '../../../hooks/useStoreSettings';
import { getDirectChatUrl } from '../../../services/whatsappService';
import { cn } from '../../../utils/cn';

/** Botão flutuante verde. No mobile sobe quando a barra do carrinho aparece. */
export function WhatsAppButton() {
  const { itemCount } = useCart();
  const { whatsapp } = useStoreSettings();

  return (
    <a
      href={getDirectChatUrl(whatsapp)}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Faça seu pedido pelo WhatsApp"
      className={cn(
        'fixed right-[clamp(14px,2vw,24px)] z-44 flex h-14 min-w-14 items-center justify-center gap-2.5 rounded-full bg-whatsapp text-sm font-extrabold text-white shadow-fab transition-[bottom,transform] duration-300 hover:-translate-y-0.5 md:bottom-[clamp(14px,2vw,24px)] md:pr-5 md:pl-4',
        itemCount > 0 ? 'bottom-[86px]' : 'bottom-[clamp(14px,2vw,24px)]',
      )}
    >
      <MessageCircle size={24} strokeWidth={2} aria-hidden="true" />
      <span className="max-md:hidden">Faça seu pedido</span>
    </a>
  );
}
