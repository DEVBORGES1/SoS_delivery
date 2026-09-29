import { useNavigate } from 'react-router';
import { useStoreStatus } from '../../../hooks/useStoreStatus';
import { ROUTES } from '../../../routes';
import { useUIStore } from '../../../stores/uiStore';
import { formatCurrency } from '../../../utils/currency';
import { SectionLink } from '../../layout/SectionLink';
import { Button } from '../../ui/Button/Button';
import { buttonClasses } from '../../ui/Button/buttonStyles';

/** Rodapé do carrinho: subtotal e ações para seguir ao checkout. */
export function CartSummary({ subtotal }: { subtotal: number }) {
  const navigate = useNavigate();
  const closeCart = useUIStore((state) => state.closeCart);
  const { isOpen, labels } = useStoreStatus();

  const goToCheckout = () => {
    closeCart();
    navigate(ROUTES.checkout);
  };

  return (
    <div className="flex flex-col gap-3 border-t border-line px-5 pt-[18px] pb-[22px]">
      <div className="flex items-baseline justify-between">
        <span className="text-base font-bold">Subtotal</span>
        <span className="text-[26px] font-extrabold">{formatCurrency(subtotal)}</span>
      </div>
      {!isOpen && (
        <p className="text-[13px] font-semibold text-danger">
          Loja fechada agora — envie a partir de {labels.nextOpening}.
        </p>
      )}
      <Button size="xl" shape="rounded" fullWidth onClick={goToCheckout}>
        CONTINUAR PEDIDO →
      </Button>
      <SectionLink sectionId="cardapio" className={buttonClasses({ variant: 'ghost', size: 'xs', fullWidth: true })}>
        Adicionar mais itens
      </SectionLink>
    </div>
  );
}
