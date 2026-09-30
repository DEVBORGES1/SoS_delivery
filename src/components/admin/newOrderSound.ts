import { create } from 'zustand';

/** Som do pedido novo. Para trocar, substitua o arquivo `public/sounds/new-order.mp3`. */
export const NEW_ORDER_SOUND_URL = '/sounds/new-order.mp3';

const SOUND_KEY = 'admin_notification_sound';
const VOLUME_KEY = 'admin_notification_volume';
const DEFAULT_VOLUME = 0.8;

function readStorage(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStorage(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Sem localStorage (aba anônima bloqueada): a preferência vale só nesta visita.
  }
}

function readVolume(): number {
  const value = Number(readStorage(VOLUME_KEY));
  return readStorage(VOLUME_KEY) !== null && value >= 0 && value <= 1 ? value : DEFAULT_VOLUME;
}

let audio: HTMLAudioElement | null = null;

function getAudio(): HTMLAudioElement {
  if (!audio) {
    audio = new Audio(NEW_ORDER_SOUND_URL);
    audio.preload = 'auto';
  }
  return audio;
}

function isAutoplayBlock(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'NotAllowedError';
}

interface SoundState {
  /** Preferência do lojista (salva neste aparelho). */
  enabled: boolean;
  volume: number;
  /**
   * O navegador ainda não deixa tocar som: nenhuma interação com a página
   * desde que ela abriu (política de autoplay).
   */
  blocked: boolean;
  setEnabled: (enabled: boolean) => void;
  setVolume: (volume: number) => void;
  /** Toca o alerta. Nunca lança erro: se o navegador bloquear, só marca `blocked`. */
  play: () => void;
  stop: () => void;
  /** Libera o áudio em silêncio no primeiro clique ou tecla do lojista. */
  unlock: () => void;
}

export const useSoundStore = create<SoundState>()((set, get) => ({
  enabled: readStorage(SOUND_KEY) !== 'false',
  volume: readVolume(),
  blocked: !(typeof navigator !== 'undefined' && navigator.userActivation?.hasBeenActive),

  setEnabled: (enabled) => {
    writeStorage(SOUND_KEY, String(enabled));
    set({ enabled });
    if (!enabled) get().stop();
  },

  setVolume: (volume) => {
    writeStorage(VOLUME_KEY, String(volume));
    set({ volume });
    if (audio) audio.volume = volume;
  },

  play: () => {
    const { enabled, volume } = get();
    if (!enabled) return;
    const sound = getAudio();
    sound.muted = false;
    sound.volume = volume;
    sound.currentTime = 0;
    sound.play().then(
      () => set({ blocked: false }),
      (error: unknown) => {
        if (isAutoplayBlock(error)) set({ blocked: true });
      },
    );
  },

  stop: () => {
    if (!audio) return;
    audio.pause();
    audio.currentTime = 0;
  },

  unlock: () => {
    if (!get().blocked) return;
    const sound = getAudio();
    sound.muted = true;
    sound.play().then(
      () => {
        // Se um alerta de verdade começou nesse meio-tempo (`play` tira o mudo), não corta.
        if (sound.muted) {
          sound.pause();
          sound.currentTime = 0;
          sound.muted = false;
        }
        set({ blocked: false });
      },
      () => {
        sound.muted = false;
      },
    );
  },
}));
