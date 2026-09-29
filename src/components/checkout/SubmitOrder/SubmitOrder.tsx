import { MessageCircle } from 'lucide-react';
import { cn } from '../../../utils/cn';
import { buttonClasses } from '../../ui/Button/buttonStyles';

interface SubmitOrderButtonProps {
  label: string;
  disabled: boolean;
  onSubmit: () => void;
}

export function SubmitOrderButton({ label, disabled, onSubmit }: SubmitOrderButtonProps) {
  return (
    <>
      <button
        type="button"
        onClick={onSubmit}
        disabled={disabled}
        className={cn(
          buttonClasses({ variant: 'whatsapp', size: '2xl', shape: 'rounded', fullWidth: true }),
          'disabled:bg-disabled disabled:hover:brightness-100',
        )}
      >
        <MessageCircle size={22} strokeWidth={2} aria-hidden="true" />
        {label}
      </button>
      <p className="text-center text-[13px] text-muted">Você confirma tudo com a gente direto no WhatsApp.</p>
    </>
  );
}

export function SendErrorAlert() {
  return (
    <div role="alert" className="flex items-start gap-3.5 rounded-cta border-[1.5px] border-accent bg-accent/14 px-[18px] py-4">
      <span
        aria-hidden="true"
        className="grid size-7 flex-none place-items-center rounded-full bg-accent font-extrabold text-white"
      >
        !
      </span>
      <div className="flex-1">
        <p className="text-base font-extrabold">Não conseguimos abrir o WhatsApp</p>
        <p className="mt-0.5 text-sm text-muted">
          Verifique se o navegador bloqueou a nova aba e tente de novo. Seus dados continuam salvos.
        </p>
      </div>
    </div>
  );
}
