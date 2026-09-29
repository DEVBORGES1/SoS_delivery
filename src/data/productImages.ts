import batataBaconCheddar from '../assets/images/batata-bacon-cheddar.webp';
import brigadaDaFome from '../assets/images/brigada-da-fome.webp';
import combateDuplo from '../assets/images/combate-duplo.webp';
import operacaoCrocante from '../assets/images/operacao-crocante.webp';
import resgateDoPescador from '../assets/images/resgate-do-pescador.webp';
import resgateEmEquipe from '../assets/images/resgate-em-equipe.webp';
import resgateRapido from '../assets/images/resgate-rapido.webp';
import resgateSupremo from '../assets/images/resgate-supremo.webp';
import sosBravo from '../assets/images/sos-bravo.webp';

interface ProductImage {
  label: string;
  src: string;
}

/**
 * Fotos disponíveis para os produtos. O banco guarda só a chave (`image_key`);
 * para usar uma foto nova, coloque o arquivo em `src/assets/images/` e
 * registre aqui — ela passa a aparecer na lista de fotos do painel.
 */
export const productImages: Record<string, ProductImage> = {
  'batata-bacon-cheddar': { label: 'Batata, Bacon e Cheddar', src: batataBaconCheddar },
  'brigada-da-fome': { label: 'Brigada da Fome', src: brigadaDaFome },
  'combate-duplo': { label: 'Combate Duplo', src: combateDuplo },
  'operacao-crocante': { label: 'Operação Crocante', src: operacaoCrocante },
  'resgate-do-pescador': { label: 'Resgate do Pescador', src: resgateDoPescador },
  'resgate-em-equipe': { label: 'Resgate em Equipe', src: resgateEmEquipe },
  'resgate-rapido': { label: 'Resgate Rápido', src: resgateRapido },
  'resgate-supremo': { label: 'Resgate Supremo', src: resgateSupremo },
  'sos-bravo': { label: 'SOS Bravo', src: sosBravo },
};

export function getProductImage(key: string | null | undefined): string | undefined {
  return key ? productImages[key]?.src : undefined;
}
