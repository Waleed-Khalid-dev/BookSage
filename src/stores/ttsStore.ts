import { create } from 'zustand';

interface TtsState {
  audioElement: HTMLAudioElement;
  edgeTimings: any[];
  isPlaying: boolean;
  isPaused: boolean;
  voiceURI: string;
  playbackRate: number;
  fullTextToRead: string;
  startNonWs: number | null;
  activePageNum: number | null;

  setAudioElement: (audio: HTMLAudioElement) => void;
  setEdgeTimings: (timings: any[]) => void;
  setIsPlaying: (playing: boolean) => void;
  setIsPaused: (paused: boolean) => void;
  setVoiceURI: (voice: string) => void;
  setPlaybackRate: (rate: number) => void;
  setFullTextToRead: (text: string) => void;
  setStartNonWs: (val: number | null) => void;
  setActivePageNum: (val: number | null) => void;
}

export const useTtsStore = create<TtsState>((set) => ({
  audioElement: new Audio(),
  edgeTimings: [],
  isPlaying: false,
  isPaused: false,
  voiceURI: 'en-US-AriaNeural',
  playbackRate: 1.0,
  fullTextToRead: '',
  startNonWs: null,
  activePageNum: null,

  setAudioElement: (audio) => set({ audioElement: audio }),
  setEdgeTimings: (timings) => set({ edgeTimings: timings }),
  setIsPlaying: (playing) => set({ isPlaying: playing }),
  setIsPaused: (paused) => set({ isPaused: paused }),
  setVoiceURI: (voice) => set({ voiceURI: voice }),
  setPlaybackRate: (rate) => set({ playbackRate: rate }),
  setFullTextToRead: (text) => set({ fullTextToRead: text }),
  setStartNonWs: (val) => set({ startNonWs: val }),
  setActivePageNum: (val) => set({ activePageNum: val }),
}));
