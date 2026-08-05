import { create } from 'zustand';

interface SearchState {
  isSearchModalOpen: boolean;
  setSearchModalOpen: (open: boolean) => void;
}

export const useSearchStore = create<SearchState>((set) => ({
  isSearchModalOpen: false,
  setSearchModalOpen: (open) => set({ isSearchModalOpen: open }),
}));
