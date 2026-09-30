import { storeConfig } from '../../data/storeConfig';
import { useStoreSettings } from '../../hooks/useStoreSettings';
import { formatClock } from '../../utils/storeHours';

const SCHEMA_DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/**
 * Dados da loja no formato schema.org (Restaurant) para o Google mostrar
 * endereço, telefone e horário na busca e no Maps. O horário vem do painel,
 * então acompanha qualquer mudança feita lá.
 */
export function StoreStructuredData() {
  const { weeklyHours, whatsapp } = useStoreSettings();

  const data = {
    '@context': 'https://schema.org',
    '@type': 'Restaurant',
    '@id': `${storeConfig.siteUrl}#loja`,
    name: storeConfig.name,
    slogan: storeConfig.tagline,
    url: storeConfig.siteUrl,
    image: `${storeConfig.siteUrl}og-sos-delivery.jpg`,
    logo: `${storeConfig.siteUrl}apple-touch-icon.png`,
    telephone: `+${whatsapp}`,
    servesCuisine: ['Hambúrguer', 'Lanches', 'Porções'],
    priceRange: '$$',
    hasMenu: `${storeConfig.siteUrl}#cardapio`,
    acceptsReservations: false,
    address: {
      '@type': 'PostalAddress',
      streetAddress: storeConfig.address,
      addressLocality: storeConfig.city,
      addressRegion: storeConfig.state,
      postalCode: storeConfig.zipCode,
      addressCountry: 'BR',
    },
    geo: { '@type': 'GeoCoordinates', ...storeConfig.geo },
    openingHoursSpecification: weeklyHours
      .filter((day) => day.opensAt !== null && day.closesAt !== null)
      .map((day) => ({
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: SCHEMA_DAYS[day.day],
        opens: formatClock(day.opensAt!),
        closes: formatClock(day.closesAt!),
      })),
    sameAs: [storeConfig.instagramUrl],
  };

  // "<" escapado para o conteúdo nunca fechar a tag <script> antes da hora.
  const json = JSON.stringify(data).replace(/</g, '\\u003c');
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />;
}
