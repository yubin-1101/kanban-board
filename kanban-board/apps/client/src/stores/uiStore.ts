import { create } from 'zustand';

interface UiState {
  selectedCardId: string | null;
  isCardModalOpen: boolean;
  openCardModal: (cardId: string) => void;
  closeCardModal: () => void;
}

export const useUiStore = create<UiState>((set) => ({
  selectedCardId: null,
  isCardModalOpen: false,
  openCardModal: (cardId) => set({ selectedCardId: cardId, isCardModalOpen: true }),
  closeCardModal: () => set({ selectedCardId: null, isCardModalOpen: false }),
}));
