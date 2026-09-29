import batataBaconCheddar from '../assets/images/batata-bacon-cheddar.webp';
import brigadaDaFome from '../assets/images/brigada-da-fome.webp';
import combateDuplo from '../assets/images/combate-duplo.webp';
import operacaoCrocante from '../assets/images/operacao-crocante.webp';
import resgateDoPescador from '../assets/images/resgate-do-pescador.webp';
import sosBravo from '../assets/images/sos-bravo.webp';

interface NavItem {
  label: string;
  sectionId: string;
}

export const navItems: NavItem[] = [
  { label: 'Início', sectionId: 'inicio' },
  { label: 'Cardápio', sectionId: 'cardapio' },
  { label: 'Sobre nós', sectionId: 'sobre' },
  { label: 'Contato', sectionId: 'contato' },
];

export const aboutStats = [
  { value: '5', label: 'meses de história' },
  { value: '100%', label: 'artesanal' },
  { value: '60', label: 'pedidos por dia, em média' },
];

/** Grade do Instagram. Itens sem `image` exibem o espaço reservado do mockup. */
export const instagramPosts: { alt: string; image?: string }[] = [
  { alt: 'Combate Duplo', image: combateDuplo },
  { alt: 'Batata, Bacon e Cheddar', image: batataBaconCheddar },
  { alt: 'SOS Bravo', image: sosBravo },
  { alt: 'Resgate do Pescador', image: resgateDoPescador },
  { alt: 'Brigada da Fome', image: brigadaDaFome },
  { alt: 'Operação Crocante', image: operacaoCrocante },
];
