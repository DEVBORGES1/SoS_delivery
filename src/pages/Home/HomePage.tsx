import { About } from '../../components/home/About/About';
import { Hero } from '../../components/home/Hero/Hero';
import { InstagramSection } from '../../components/home/InstagramSection/InstagramSection';
import { Location } from '../../components/home/Location/Location';
import { MenuSection } from '../../components/menu/MenuSection/MenuSection';
import { WhatsAppButton } from '../../components/layout/FloatingActions/WhatsAppButton';
import { StoreStructuredData } from '../../components/seo/StoreStructuredData';
import { MobileCartBar } from '../../components/layout/FloatingActions/MobileCartBar';
import { useCatalog } from '../../hooks/useCatalog';
import { useScrollToHash } from '../../hooks/useScrollToHash';

export function HomePage() {
  const { products, categories } = useCatalog();
  useScrollToHash();

  const featuredProduct = products.find((product) => product.featured && product.available);

  return (
    <>
      <StoreStructuredData />
      <Hero featuredProduct={featuredProduct} />
      <MenuSection products={products} categories={categories} />
      <About />
      <Location />
      <InstagramSection />
      <MobileCartBar />
      <WhatsAppButton />
    </>
  );
}
