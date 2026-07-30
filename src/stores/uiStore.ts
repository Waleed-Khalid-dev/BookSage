import { create } from 'zustand';

export type ViewType = 'library' | 'reader' | 'notes' | 'pipeline' | 'chat';

interface UiState {
  activeView: ViewType;
  theme: 'dark' | 'light';
  setActiveView: (view: ViewType) => void;
  setTheme: (theme: 'dark' | 'light') => void;
}

export const useUiStore = create<UiState>((set) => ({
  activeView: 'library',
  theme: 'dark',
  setActiveView: (view) => set({ activeView: view }),
  setTheme: (theme) => set({ theme }),
}));
