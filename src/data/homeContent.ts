import chamadoSos from '../assets/images/chamado-sos.webp';
import combateDuplo from '../assets/images/combate-duplo.webp';
import combateDuploTabua from '../assets/images/combate-duplo-tabua.webp';
import resgateRapido from '../assets/images/resgate-rapido.webp';

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
  { value: '+5 anos', label: 'de história' },
  { value: '100%', label: 'artesanal' },
  { value: '+10 mil', label: 'pedidos entregues' },
];

/** Grade do Instagram. Itens sem `image` exibem o espaço reservado do mockup. */
export const instagramPosts: { alt: string; image?: string }[] = [
  { alt: 'Chamado SOS', image: chamadoSos },
  { alt: 'foto · salão / fachada' },
  { alt: 'Resgate Rápido', image: resgateRapido },
  { alt: 'Combate Duplo', image: combateDuploTabua },
  { alt: 'foto · chapa em ação' },
  { alt: 'Combate Duplo de perto', image: combateDuplo },
];
