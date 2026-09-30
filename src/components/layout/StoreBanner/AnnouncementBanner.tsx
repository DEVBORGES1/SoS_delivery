import { useStoreSettings } from '../../../hooks/useStoreSettings';

/** Aviso em faixa amarela no topo do site, ligado e escrito pelo painel. */
export function AnnouncementBanner() {
  const { bannerEnabled, bannerText } = useStoreSettings();
  if (!bannerEnabled || !bannerText.trim()) return null;

  return (
    <div role="note" className="bg-mustard px-gutter py-2.5 text-center text-sm font-bold text-pretty text-mustard-ink">
      {bannerText}
    </div>
  );
}
