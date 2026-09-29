import { instagramPosts } from '../../../data/homeContent';
import { storeConfig } from '../../../data/storeConfig';
import { ButtonLink } from '../../ui/Button/Button';

export function InstagramSection() {
  return (
    <section aria-labelledby="instagram-title" className="px-gutter py-[clamp(64px,9vw,112px)]">
      <div className="mx-auto max-w-[1280px]">
        <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 id="instagram-title" className="font-display text-[clamp(42px,6vw,76px)] leading-[.95] uppercase">
              Siga a gente
            </h2>
            <p className="mt-2 text-lg font-bold text-accent">{storeConfig.instagram}</p>
          </div>
          <ButtonLink href={storeConfig.instagramUrl} external variant="outline" size="sm">
            Abrir Instagram →
          </ButtonLink>
        </div>

        <ul className="grid grid-cols-3 gap-[clamp(6px,1vw,12px)] md:grid-cols-6">
          {instagramPosts.map((post) => (
            <li key={post.alt}>
              <a
                href={storeConfig.instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${post.alt} — ver no Instagram`}
                className="bg-stripes group relative block aspect-square overflow-hidden rounded-[clamp(8px,1.2vw,16px)]"
              >
                {post.image ? (
                  <img
                    src={post.image}
                    alt=""
                    loading="lazy"
                    decoding="async"
                    className="size-full object-cover transition-[scale] duration-500 group-hover:scale-[1.06]"
                  />
                ) : (
                  <span className="absolute inset-0 grid place-items-center p-2 text-center font-mono text-[11px] text-muted">
                    {post.alt}
                  </span>
                )}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
