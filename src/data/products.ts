import batataBaconCheddar from '../assets/images/batata-bacon-cheddar.webp';
import brigadaDaFome from '../assets/images/brigada-da-fome.webp';
import combateDuplo from '../assets/images/combate-duplo.webp';
import operacaoCrocante from '../assets/images/operacao-crocante.webp';
import resgateDoPescador from '../assets/images/resgate-do-pescador.webp';
import resgateEmEquipe from '../assets/images/resgate-em-equipe.webp';
import resgateRapido from '../assets/images/resgate-rapido.webp';
import resgateSupremo from '../assets/images/resgate-supremo.webp';
import sosBravo from '../assets/images/sos-bravo.webp';
import type { Product } from '../types/product';

/**
 * Cardápio. Os preços ainda não foram definidos: todos os itens estão com
 * `price: 0` e `available: false`. Para liberar um item, preencha o preço
 * (ex.: `price: 32.9`) e troque para `available: true`.
 */
export const products: Product[] = [
  {
    id: 'brigada-da-fome',
    categoryId: 'burgers',
    name: 'Brigada da Fome',
    description: 'Frango empanado super crocante, cheddar cremoso, alface e pão brioche.',
    price: 0,
    image: brigadaDaFome,
    imagePosition: '50% 62%',
    available: false,
  },
  {
    id: 'combate-duplo',
    categoryId: 'burgers',
    name: 'Combate Duplo',
    description: 'Dois blends artesanais, queijo coalho na chapa, maionese da casa, alface e pão brioche.',
    price: 0,
    image: combateDuplo,
    imagePosition: '50% 62%',
    badge: 'Duplo',
    available: false,
    featured: true,
  },
  {
    id: 'sos-bravo',
    categoryId: 'burgers',
    name: 'SOS Bravo',
    description: 'Blend artesanal, queijo derretido, ovo, alface, tomate e maionese verde no pão brioche.',
    price: 0,
    image: sosBravo,
    imagePosition: '50% 66%',
    available: false,
  },
  {
    id: 'linha-de-frente',
    categoryId: 'burgers',
    name: 'Linha de Frente',
    description: 'Descrição em breve.',
    price: 0,
    available: false,
  },
  {
    id: 'batata-bacon-cheddar',
    categoryId: 'porcoes',
    name: 'Batata, Bacon e Cheddar',
    description: 'Batata frita coberta com cheddar cremoso e bacon crocante.',
    price: 0,
    image: batataBaconCheddar,
    imagePosition: '50% 70%',
    available: false,
  },
  {
    id: 'operacao-crocante',
    categoryId: 'porcoes',
    name: 'Operação Crocante',
    description: 'Carne em tiras acebolada com pimentão, batata frita e mandioca frita.',
    price: 0,
    image: operacaoCrocante,
    imagePosition: '50% 75%',
    available: false,
  },
  {
    id: 'resgate-rapido',
    categoryId: 'porcoes',
    name: 'Resgate Rápido',
    description: 'Frango empanado, polenta frita e batata frita, com limão e molhos.',
    price: 0,
    image: resgateRapido,
    imagePosition: '50% 60%',
    available: false,
  },
  {
    id: 'resgate-em-equipe',
    categoryId: 'porcoes',
    name: 'Resgate em Equipe',
    description: 'Tiras de frango empanadas, polenta frita e batata frita.',
    price: 0,
    image: resgateEmEquipe,
    imagePosition: '50% 60%',
    available: false,
  },
  {
    id: 'resgate-do-pescador',
    categoryId: 'porcoes',
    name: 'Resgate do Pescador',
    description: 'Peixe e camarão empanados, polenta frita e batata frita, com limão e molho tártaro.',
    price: 0,
    image: resgateDoPescador,
    imagePosition: '50% 70%',
    available: false,
  },
  {
    id: 'resgate-supremo',
    categoryId: 'porcoes',
    name: 'Resgate Supremo',
    description: 'Tiras de frango empanadas e batata frita crocante.',
    price: 0,
    image: resgateSupremo,
    imagePosition: '50% 72%',
    available: false,
  },
];
