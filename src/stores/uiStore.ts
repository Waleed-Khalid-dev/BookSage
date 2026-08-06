import { create } from 'zustand';
import { SelectionData } from '../hooks/useTextSelection';

export type ViewType = 'library' | 'reader' | 'notes' | 'pipeline' | 'chat';

interface UiState {
  activeView: ViewType;
  theme: 'dark' | 'light';
  isTtsPlaying: boolean;
  isSettingsOpen: boolean;
  activeSelection: SelectionData | null;
  ttsHighlight: { pageNum: number; rects: { top: number; left: number; width: number; height: number }[] } | null;
  setActiveView: (view: ViewType) => void;
  setTheme: (theme: 'dark' | 'light') => void;
  setIsTtsPlaying: (isPlaying: boolean) => void;
  setIsSettingsOpen: (isOpen: boolean) => void;
  setActiveSelection: (selection: SelectionData | null) => void;
  setTtsHighlight: (highlight: { pageNum: number; rects: any[] } | null) => void;
}

export const useUiStore = create<UiState>((set) => ({
  activeView: 'library',
  theme: 'dark',
  isTtsPlaying: false,
  isSettingsOpen: false,
  activeSelection: null,
  ttsHighlight: null,
  setActiveView: (view) => set({ activeView: view }),
  setTheme: (theme) => set({ theme }),
  setIsTtsPlaying: (isPlaying) => set({ isTtsPlaying: isPlaying }),
  setIsSettingsOpen: (isOpen) => set({ isSettingsOpen: isOpen }),
  setActiveSelection: (selection) => set({ activeSelection: selection }),
  setTtsHighlight: (highlight) => set({ ttsHighlight: highlight }),
}));
