import { UserRoundCheck } from 'lucide-react';

interface ReturningCustomerProps {
  firstName: string;
  onForget: () => void;
}

/** Aviso de que o formulário veio preenchido com os dados do último pedido. */
export function ReturningCustomer({ firstName, onForget }: ReturningCustomerProps) {
  return (
    <div className="flex items-start gap-3.5 rounded-[20px] border border-line bg-surface px-[18px] py-4">
      <span aria-hidden="true" className="grid size-9 flex-none place-items-center rounded-full bg-accent/14 text-accent">
        <UserRoundCheck size={19} strokeWidth={2.2} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-base font-extrabold">Bem-vindo de volta, {firstName}!</p>
        <p className="mt-0.5 text-sm text-pretty text-muted">
          Preenchemos com os dados do seu último pedido. Confira e altere o que precisar.{' '}
          <button
            type="button"
            onClick={onForget}
            className="cursor-pointer font-bold text-ink underline underline-offset-[3px] hover:text-accent"
          >
            Não é você? Limpar dados
          </button>
        </p>
      </div>
    </div>
  );
}
