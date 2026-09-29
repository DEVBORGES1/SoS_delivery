import { create } from 'zustand';
import type { Product } from '../types/product';

const TOAST_DURATION_MS = 2600;
const CART_BUMP_DURATION_MS = 350;

interface UIState {
  isCartOpen: boolean;
  isMobileMenuOpen: boolean;
  isProductModalOpen: boolean;
  selectedProduct: Product | null;
  /** Muda a cada abertura do modal para reiniciar quantidade/adicionais. */
  productModalSession: number;
  toastMessage: string;
  isToastVisible: boolean;
  isCartBumping: boolean;

  openCart: () => void;
  closeCart: () => void;
  toggleMobileMenu: () => void;
  closeMobileMenu: () => void;
  openProduct: (product: Product) => void;
  closeProductModal: () => void;
  notifyItemAdded: (message: string) => void;
}

let toastTimer: ReturnType<typeof setTimeout> | undefined;
let bumpTimer: ReturnType<typeof setTimeout> | undefined;

export const useUIStore = create<UIState>()((set) => ({
  isCartOpen: false,
  isMobileMenuOpen: false,
  isProductModalOpen: false,
  selectedProduct: null,
  productModalSession: 0,
  toastMessage: '',
  isToastVisible: false,
  isCartBumping: false,

  openCart: () => set({ isCartOpen: true, isToastVisible: false, isMobileMenuOpen: false }),
  closeCart: () => set({ isCartOpen: false }),

  toggleMobileMenu: () => set((state) => ({ isMobileMenuOpen: !state.isMobileMenuOpen })),
  closeMobileMenu: () => set({ isMobileMenuOpen: false }),

  openProduct: (product) =>
    set((state) => ({
      selectedProduct: product,
      isProductModalOpen: true,
      productModalSession: state.productModalSession + 1,
    })),
  closeProductModal: () => set({ isProductModalOpen: false }),

  notifyItemAdded: (message) => {
    set({ toastMessage: message, isToastVisible: true, isCartBumping: true });
    clearTimeout(toastTimer);
    clearTimeout(bumpTimer);
    toastTimer = setTimeout(() => set({ isToastVisible: false }), TOAST_DURATION_MS);
    bumpTimer = setTimeout(() => set({ isCartBumping: false }), CART_BUMP_DURATION_MS);
  },
}));
