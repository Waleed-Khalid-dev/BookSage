import { create } from 'zustand';
import { SelectionData } from '../hooks/useTextSelection';

export type ViewType = 'library' | 'reader' | 'notes' | 'pipeline' | 'chat';

interface UiState {
  activeView: ViewType;
  theme: 'dark' | 'light';
  isTtsPlaying: boolean;
  isSettingsOpen: boolean;
  isNotesSplitOpen: boolean;
  notesSplitWidth: number;
  activeSelection: SelectionData | null;
  ttsHighlight: { pageNum: number; rects: { top: number; left: number; width: number; height: number }[] } | null;
  focusedPanel: 'reader' | 'notes' | null;
  setActiveView: (view: ViewType) => void;
  setTheme: (theme: 'dark' | 'light') => void;
  setIsTtsPlaying: (isPlaying: boolean) => void;
  setIsSettingsOpen: (isOpen: boolean) => void;
  toggleNotesSplit: () => void;
  setNotesSplitWidth: (width: number) => void;
  setActiveSelection: (selection: SelectionData | null) => void;
  setTtsHighlight: (highlight: { pageNum: number; rects: any[] } | null) => void;
  setFocusedPanel: (panel: 'reader' | 'notes' | null) => void;
}

export const useUiStore = create<UiState>((set) => ({
  activeView: 'library',
  theme: 'dark',
  isTtsPlaying: false,
  isSettingsOpen: false,
  isNotesSplitOpen: false,
  notesSplitWidth: 50,
  activeSelection: null,
  ttsHighlight: null,
  focusedPanel: null,
  setActiveView: (view) => set({ activeView: view }),
  setTheme: (theme) => set({ theme }),
  setIsTtsPlaying: (isPlaying) => set({ isTtsPlaying: isPlaying }),
  setIsSettingsOpen: (isOpen) => set({ isSettingsOpen: isOpen }),
  toggleNotesSplit: () => set((state) => ({ isNotesSplitOpen: !state.isNotesSplitOpen })),
  setNotesSplitWidth: (width) => set({ notesSplitWidth: width }),
  setActiveSelection: (selection) => set({ activeSelection: selection }),
  setTtsHighlight: (highlight) => set({ ttsHighlight: highlight }),
  setFocusedPanel: (panel) => set({ focusedPanel: panel }),
}));
