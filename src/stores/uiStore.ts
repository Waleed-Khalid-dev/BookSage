import { create } from 'zustand';

export type ViewType = 'library' | 'reader' | 'notes' | 'pipeline' | 'chat';

interface UiState {
  activeView: ViewType;
  theme: 'dark' | 'light';
  isTtsPlaying: boolean;
  setActiveView: (view: ViewType) => void;
  setTheme: (theme: 'dark' | 'light') => void;
  setIsTtsPlaying: (isPlaying: boolean) => void;
}

export const useUiStore = create<UiState>((set) => ({
  activeView: 'library',
  theme: 'dark',
  isTtsPlaying: false,
  setActiveView: (view) => set({ activeView: view }),
  setTheme: (theme) => set({ theme }),
  setIsTtsPlaying: (isPlaying) => set({ isTtsPlaying: isPlaying }),
}));
