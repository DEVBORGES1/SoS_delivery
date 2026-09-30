import { ChevronLeft, ChevronRight, Maximize2, X } from 'lucide-react';
import { useRef, useState } from 'react';
import feedbackChamada from '../../../assets/images/feedback-chamada.webp';
import feedbackClientes from '../../../assets/images/feedback-clientes.webp';
import { cn } from '../../../utils/cn';
import { Dialog } from '../../ui/Dialog/Dialog';

const SLIDES = [
  {
    src: feedbackChamada,
    alt: 'Arte "Não somos nós que falamos, são eles", com o lanche Combate Duplo e uma seta apontando para os feedbacks',
  },
  {
    src: feedbackClientes,
    alt: 'Feedbacks de clientes: mensagens e avaliações de cinco estrelas elogiando os lanches, a batata crocante e a entrega no horário',
  },
];

const ARROW =
  'absolute top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-full bg-[rgb(15_11_8/0.7)] text-white backdrop-blur-[6px] transition-opacity duration-200 disabled:pointer-events-none disabled:opacity-0';

/**
 * Artes de feedback na seção Sobre: carrossel (arrastar ou setas) e, ao tocar,
 * a arte em tamanho grande para dar para ler os depoimentos.
 */
export function FeedbackCarousel({ className }: { className?: string }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const [zoomed, setZoomed] = useState<number | null>(null);

  const goTo = (next: number) => {
    const track = trackRef.current;
    if (!track) return;
    track.scrollTo({ left: next * track.clientWidth, behavior: 'smooth' });
  };

  const onScroll = () => {
    const track = trackRef.current;
    if (track) setIndex(Math.round(track.scrollLeft / track.clientWidth));
  };

  return (
    <div
      role="region"
      aria-roledescription="carrossel"
      aria-label="Feedbacks dos clientes"
      className={cn('relative overflow-hidden rounded-card bg-[#1a120c]', className)}
    >
      <div
        ref={trackRef}
        onScroll={onScroll}
        className="scrollbar-none absolute inset-0 flex snap-x snap-mandatory overflow-x-auto overscroll-x-contain"
      >
        {SLIDES.map((slide, i) => (
          <div
            key={slide.src}
            role="group"
            aria-roledescription="slide"
            aria-label={`${i + 1} de ${SLIDES.length}`}
            className="relative size-full flex-none snap-center"
          >
            {/* Fundo desfocado da própria arte preenche as sobras sem cortar o texto. */}
            <img
              src={slide.src}
              alt=""
              aria-hidden="true"
              loading="lazy"
              decoding="async"
              className="absolute inset-0 size-full scale-110 object-cover opacity-60 blur-xl"
            />
            <button
              type="button"
              onClick={() => setZoomed(i)}
              aria-label={`Ampliar: ${slide.alt}`}
              className="relative size-full cursor-zoom-in"
            >
              <img
                src={slide.src}
                alt={slide.alt}
                loading="lazy"
                decoding="async"
                className="size-full object-contain"
              />
            </button>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={() => setZoomed(index)}
        aria-label="Ver em tamanho grande"
        className="absolute top-3 right-3 grid size-9 place-items-center rounded-full bg-[rgb(15_11_8/0.7)] text-white backdrop-blur-[6px]"
      >
        <Maximize2 size={16} aria-hidden="true" />
      </button>
      <button
        type="button"
        onClick={() => goTo(index - 1)}
        disabled={index === 0}
        aria-label="Arte anterior"
        className={cn(ARROW, 'left-2.5')}
      >
        <ChevronLeft size={20} aria-hidden="true" />
      </button>
      <button
        type="button"
        onClick={() => goTo(index + 1)}
        disabled={index === SLIDES.length - 1}
        aria-label="Próxima arte"
        className={cn(ARROW, 'right-2.5')}
      >
        <ChevronRight size={20} aria-hidden="true" />
      </button>
      <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5 rounded-full bg-[rgb(15_11_8/0.55)] px-2.5 py-1.5">
        {SLIDES.map((slide, i) => (
          <button
            key={slide.src}
            type="button"
            onClick={() => goTo(i)}
            aria-label={`Ir para a arte ${i + 1}`}
            aria-current={i === index}
            className={cn('h-2 rounded-full transition-[width,background-color] duration-300', i === index ? 'w-5 bg-white' : 'w-2 bg-white/50')}
          />
        ))}
      </div>

      <Dialog
        open={zoomed !== null}
        onClose={() => setZoomed(null)}
        variant="modal"
        ariaLabel="Feedback em tamanho grande"
        className="items-center justify-center overflow-hidden bg-[#0d0a08]! md:w-auto! md:max-h-[94vh]!"
      >
        {zoomed !== null && (
          <>
            <img
              src={SLIDES[zoomed].src}
              alt={SLIDES[zoomed].alt}
              className="max-h-[88vh] w-auto max-w-full object-contain md:max-h-[94vh]"
            />
            <button
              type="button"
              onClick={() => setZoomed(null)}
              aria-label="Fechar"
              className="absolute top-3.5 right-3.5 grid size-11 place-items-center rounded-full bg-[rgb(15_11_8/0.7)] text-white backdrop-blur-[6px]"
            >
              <X size={18} aria-hidden="true" />
            </button>
          </>
        )}
      </Dialog>
    </div>
  );
}
