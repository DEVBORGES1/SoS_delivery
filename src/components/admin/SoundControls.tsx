import { Volume2, VolumeX } from 'lucide-react';
import { useState } from 'react';
import { cn } from '../../utils/cn';
import { BTN_OUTLINE, CARD, CARD_PAD, MUTED, Switch } from './adminUi';
import { useSoundStore } from './newOrderSound';

/** Indicador no cabeçalho: mostra se o som de pedido novo vai tocar e liga/desliga com um toque. */
export function SoundStatusButton() {
  const { enabled, blocked, setEnabled, play } = useSoundStore();
  const needsClick = enabled && blocked;
  const on = enabled && !blocked;
  const label = on ? 'Sons ativados' : needsClick ? 'Ativar sons' : 'Sons desligados';

  return (
    <button
      type="button"
      data-sound-toggle
      onClick={() => {
        if (on) return setEnabled(false);
        setEnabled(true);
        play();
      }}
      aria-label={on ? 'Sons ativados. Toque para desligar' : `${label}. Toque para ativar`}
      className={cn(
        'flex h-10 flex-none cursor-pointer items-center gap-1.5 rounded-[10px] border px-3 text-[13px] font-bold whitespace-nowrap',
        needsClick
          ? 'border-(--adm-accent) bg-(--adm-accent) text-white'
          : 'border-(--adm-line) bg-(--adm-card) text-(--adm-ink)',
      )}
    >
      {on ? <Volume2 size={16} aria-hidden="true" /> : <VolumeX size={16} aria-hidden="true" />}
      <span className={cn(!needsClick && 'max-[599px]:hidden')}>{label}</span>
    </button>
  );
}

type Permission = NotificationPermission | 'unsupported';

function readPermission(): Permission {
  return typeof Notification === 'undefined' ? 'unsupported' : Notification.permission;
}

/** Avisos do navegador com a aba em segundo plano. A permissão só é pedida no clique do botão. */
function BrowserNotifications() {
  const [permission, setPermission] = useState<Permission>(readPermission);

  const text: Record<Permission, string> = {
    granted: 'Ativados. Com o painel em outra aba, o aviso aparece no canto da tela.',
    default: 'Mostra um aviso no computador quando o painel estiver em outra aba.',
    denied: 'Bloqueados neste navegador. Para liberar, use o ícone ao lado do endereço do site.',
    unsupported: 'Este navegador não mostra avisos do sistema. O som e o alerta na tela continuam valendo.',
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-(--adm-divider) pt-4">
      <div className="min-w-0 flex-1">
        <div className="font-bold">Avisos do navegador</div>
        <div className={cn('text-[13px]', MUTED)}>{text[permission]}</div>
      </div>
      {permission === 'default' && (
        <button
          type="button"
          onClick={() => void Notification.requestPermission().then(setPermission)}
          className={BTN_OUTLINE}
        >
          Ativar avisos
        </button>
      )}
    </div>
  );
}

/** Preferências de alerta de pedido novo (salvas só neste aparelho). */
export function NotificationSettings() {
  const { enabled, volume, blocked, setEnabled, setVolume, play } = useSoundStore();
  const percent = Math.round(volume * 100);

  return (
    <section className={cn(CARD, CARD_PAD, 'flex flex-col gap-4')}>
      <div>
        <h2 className="m-0 text-[17px] font-extrabold">Alerta de pedido novo</h2>
        <p className={cn('mt-1 mb-0 text-[13px]', MUTED)}>Vale só para este aparelho.</p>
      </div>

      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="font-bold">Notificações sonoras</div>
          <div className={cn('text-[13px]', MUTED)}>
            {!enabled
              ? 'Desligadas: o pedido novo aparece só na tela.'
              : blocked
                ? 'O navegador ainda não liberou o som. Toque em "Testar som".'
                : 'Toca quando chega um pedido e repete a cada 30 s até alguém abrir.'}
          </div>
        </div>
        <Switch label="Notificações sonoras" checked={enabled} onChange={setEnabled} />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <label htmlFor="adm-volume" className="text-sm font-bold">
          Volume
        </label>
        <input
          id="adm-volume"
          type="range"
          min={0}
          max={100}
          step={5}
          value={percent}
          disabled={!enabled}
          onChange={(event) => setVolume(Number(event.target.value) / 100)}
          className="h-2 min-w-[140px] flex-1 cursor-pointer accent-(--adm-accent) disabled:cursor-not-allowed disabled:opacity-50"
        />
        <span className="w-10 text-right text-sm font-extrabold tabular-nums">{percent}%</span>
        <button type="button" onClick={play} disabled={!enabled} className={BTN_OUTLINE}>
          Testar som
        </button>
      </div>

      <BrowserNotifications />
    </section>
  );
}
