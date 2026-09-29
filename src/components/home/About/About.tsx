import brigadaDaFome from '../../../assets/images/brigada-da-fome.webp';
import resgateSupremo from '../../../assets/images/resgate-supremo.webp';
import { aboutStats } from '../../../data/homeContent';
import { ImagePlaceholder } from '../../ui/ImagePlaceholder/ImagePlaceholder';

export function About() {
  return (
    <section
      id="sobre"
      aria-labelledby="about-title"
      className="scroll-mt-[72px] px-gutter py-[clamp(64px,9vw,120px)]"
    >
      <div className="mx-auto grid max-w-[1280px] grid-cols-[repeat(auto-fit,minmax(min(100%,420px),1fr))] items-center gap-[clamp(32px,5vw,72px)]">
        <div className="grid grid-cols-[1.25fr_1fr] grid-rows-[auto_auto] gap-3.5">
          <div className="row-span-2 min-h-[clamp(300px,36vw,460px)] overflow-hidden rounded-card">
            <ImagePlaceholder label="foto · equipe na chapa" />
          </div>
          <div className="aspect-square overflow-hidden rounded-card">
            <img
              src={brigadaDaFome}
              alt="Brigada da Fome com batata frita"
              loading="lazy"
              decoding="async"
              className="size-full object-cover"
            />
          </div>
          <div className="aspect-square overflow-hidden rounded-card">
            <img
              src={resgateSupremo}
              alt="Porção Resgate Supremo"
              loading="lazy"
              decoding="async"
              className="size-full object-cover"
            />
          </div>
        </div>

        <div>
          <p className="text-[13px] font-extrabold tracking-[.24em] text-accent">SOBRE NÓS</p>
          <h2 id="about-title" className="mt-2.5 font-display text-[clamp(40px,5.5vw,72px)] leading-[.95] uppercase">
            Nascemos pra atender o chamado.
          </h2>
          <p className="mt-5 max-w-[500px] text-[17px] leading-[1.6] text-pretty text-muted">
            Começamos como um delivery de bairro em Videira com uma ideia simples: hambúrguer de verdade, rápido e bem
            feito. Blend moído na casa, pão brioche selado na chapa e zero atalho.
          </p>
          <dl className="mt-9 grid grid-cols-3 gap-3 border-t border-line pt-7">
            {aboutStats.map((stat) => (
              <div key={stat.label} className="flex flex-col-reverse">
                <dt className="mt-2 text-sm leading-[1.3] font-semibold text-muted">{stat.label}</dt>
                <dd className="font-display text-[clamp(34px,4.5vw,54px)] leading-none text-accent">{stat.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}
