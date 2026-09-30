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
 * Fotos disponíveis para os produtos. O `label` descreve o que aparece na foto
 * (é o que o painel mostra na lista "Foto"). O banco guarda só a chave (`image_key`);
 * para usar uma foto nova, coloque o arquivo em `src/assets/images/` e
 * registre aqui — ela passa a aparecer na lista de fotos do painel.
 */
export const productImages: Record<string, ProductImage> = {
  'batata-bacon-cheddar': { label: 'Batata com cheddar e bacon', src: batataBaconCheddar },
  'brigada-da-fome': { label: 'Lanche de frango crocante com cheddar', src: brigadaDaFome },
  'combate-duplo': { label: 'Lanche duplo com queijo coalho', src: combateDuplo },
  'operacao-crocante': { label: 'Carne acebolada, fritas e mandioca', src: operacaoCrocante },
  'resgate-do-pescador': { label: 'Peixe e camarão, polenta, fritas e limão', src: resgateDoPescador },
  'resgate-em-equipe': { label: 'Tiras de frango, polenta e fritas', src: resgateEmEquipe },
  'resgate-rapido': { label: 'Frango empanado, polenta, fritas e limão', src: resgateRapido },
  'resgate-supremo': { label: 'Tiras de frango com fritas', src: resgateSupremo },
  'sos-bravo': { label: 'Lanche com ovo e maionese verde', src: sosBravo },
};

export function getProductImage(key: string | null | undefined): string | undefined {
  return key ? productImages[key]?.src : undefined;
}
