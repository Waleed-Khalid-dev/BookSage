import { useState, useEffect, useRef } from 'react';
import { Play, Pause, Square, Loader, Type } from 'lucide-react';
import { invokePython } from '../../services/pythonService';
import { useBookStore } from '../../stores/bookStore';
import { useUiStore } from '../../stores/uiStore';
import { useTtsStore } from '../../stores/ttsStore';
import { getNonWsOffset, getRangeByNonWs } from '../../utils/domUtils';

const EDGE_VOICES = [
  { voiceURI: 'en-US-AriaNeural', name: 'Aria (Premium Female)', isEdge: true },
  { voiceURI: 'en-US-GuyNeural', name: 'Guy (Premium Male)', isEdge: true },
  { voiceURI: 'en-GB-SoniaNeural', name: 'Sonia (Premium Female)', isEdge: true },
  { voiceURI: 'en-GB-RyanNeural', name: 'Ryan (Premium Male)', isEdge: true },
];

export function AudioToolbar() {
  const { 
    audioElement, isPlaying, isPaused, voiceURI, playbackRate, 
    startNonWs, activePageNum,
    setEdgeTimings, setIsPlaying, setIsPaused, setVoiceURI, setPlaybackRate,
    setFullTextToRead, setStartNonWs, setActivePageNum
  } = useTtsStore();

  const setTtsHighlight = useUiStore(state => state.setTtsHighlight);
  const setIsUiTtsPlaying = useUiStore(state => state.setIsTtsPlaying); // Sync global playing state for app UI if needed
  const activeView = useUiStore(state => state.activeView);
  const [isLoading, setIsLoading] = useState(false);
  const [nativeVoices, setNativeVoices] = useState<SpeechSynthesisVoice[]>([]);
  
  const isWordHighlightingEnabled = useBookStore(state => state.isWordHighlightingEnabled);
  const setIsWordHighlightingEnabled = useBookStore(state => state.setIsWordHighlightingEnabled);
  
  const rafRef = useRef<number>(0);
  const lastWordRef = useRef<number | null>(null);
  
  // Sync UI store (used by some global layouts)
  useEffect(() => { setIsUiTtsPlaying(isPlaying); }, [isPlaying, setIsUiTtsPlaying]);

  // Global Keyboard Shortcut Listener
  useEffect(() => {
    const handleGlobalShortcut = (e: CustomEvent) => {
      if (e.detail.action === 'tts-play-pause') {
        if (isPlaying) {
          pause();
        } else {
          speak();
        }
      }
    };
    
    window.addEventListener('shortcut-triggered', handleGlobalShortcut as EventListener);
    return () => window.removeEventListener('shortcut-triggered', handleGlobalShortcut as EventListener);
  }, [isPlaying, isPaused, voiceURI, playbackRate]); // Dependencies for speak/pause

  // Edge TTS Tracking Loop
  useEffect(() => {
    const trackEdgeHighlight = () => {
      const state = useTtsStore.getState();
      const isEdgeVoice = EDGE_VOICES.some(v => v.voiceURI === state.voiceURI);

      if (state.audioElement && state.isPlaying && isEdgeVoice && state.fullTextToRead) {
        const currentTime = state.audioElement.currentTime;
        
        // Find current word
        const currentWord = state.edgeTimings.find(w => currentTime >= w.time_start && currentTime <= w.time_end);
        
        // Edge TTS tracking logic using DOM-independent non-whitespace offsets
        if (isWordHighlightingEnabled && state.startNonWs !== null && state.activePageNum !== null) {
          if (currentWord) {
            if (lastWordRef.current !== currentWord.char_start) {
              lastWordRef.current = currentWord.char_start;
              const textLayer = document.querySelector(`.textLayer[data-page-number="${state.activePageNum}"]`) as HTMLElement;
              if (textLayer) {
                const textBefore = state.fullTextToRead.substring(0, currentWord.char_start);
                const nonWsBefore = textBefore.replace(/\s/g, '').length;
                
                const wordText = state.fullTextToRead.substring(currentWord.char_start, currentWord.char_end);
                const nonWsLength = wordText.replace(/\s/g, '').length;
                
                const wordRange = getRangeByNonWs(textLayer, state.startNonWs + nonWsBefore, nonWsLength);
                
                if (wordRange) {
                  const rects = Array.from(wordRange.getClientRects());
                  const viewer = document.querySelector('.pdf-scroll-container');
                  
                  if (viewer && rects.length > 0) {
                    const viewerRect = viewer.getBoundingClientRect();
                    const textLayerRect = textLayer.getBoundingClientRect();
                    const scaleAttr = parseFloat(textLayer.style.getPropertyValue('--scale-factor') || '1.0');
                    const trueVisualScale = textLayerRect.width / textLayer.offsetWidth;
                    const fullScale = trueVisualScale * scaleAttr;
                    
                    const relativeRects = rects.map(r => ({
                      top: (r.top - textLayerRect.top) / fullScale,
                      left: (r.left - textLayerRect.left) / fullScale,
                      width: r.width / fullScale,
                      height: r.height / fullScale
                    }));
                    
                    setTtsHighlight({ pageNum: state.activePageNum, rects: relativeRects });
                    
                    const firstRect = rects[0];
                    if (firstRect.top < viewerRect.top || firstRect.bottom > viewerRect.bottom) {
                      viewer.scrollBy({ top: firstRect.top - viewerRect.top - viewerRect.height / 2, behavior: 'smooth' });
                    }
                  }
                }
              }
            }
          } else {
            if (lastWordRef.current !== null) {
              setTtsHighlight(null);
              lastWordRef.current = null;
            }
          }
        }
      }
      
      rafRef.current = requestAnimationFrame(trackEdgeHighlight);
    };

    rafRef.current = requestAnimationFrame(trackEdgeHighlight);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [isWordHighlightingEnabled, setTtsHighlight]);

  useEffect(() => {
    const updateVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices();
      setNativeVoices(availableVoices);
    };

    updateVoices();
    window.speechSynthesis.onvoiceschanged = updateVoices;
    
    // We only attach to the global audioElement if it doesn't already have an onended handler
    // This prevents multiple toolbars from overwriting each other unnecessarily
    audioElement.preservesPitch = true;
    audioElement.onended = () => {
      setIsPlaying(false);
      setIsPaused(false);
    };
    
    return () => {
      // NOTE: We do NOT cancel synthesis or pause audio on unmount anymore
      // because the user might just be toggling a panel or switching views while listening!
    };
  }, [audioElement, setIsPlaying, setIsPaused]);

  const isEdgeVoice = EDGE_VOICES.some(v => v.voiceURI === voiceURI);

  const speak = async () => {
    if (isPaused) {
      if (isEdgeVoice && audioElement) {
        audioElement.play();
      } else {
        window.speechSynthesis.resume();
      }
      setIsPaused(false);
      setIsPlaying(true);
      return;
    }

    const selection = window.getSelection();
    if (!selection || selection.toString().trim().length === 0) return;
    const range = selection.getRangeAt(0);
    
    let container = range.startContainer as HTMLElement;
    if (container.nodeType === 3) container = container.parentElement as HTMLElement;
    
    // Safely check for .textLayer in case we are in NotesViewer (no PDF layer)
    const textLayer = container.closest ? container.closest('.textLayer') as HTMLElement : null;
    
    if (textLayer) {
      const pageNum = parseInt(textLayer.getAttribute('data-page-number') || '0', 10);
      const offset = getNonWsOffset(textLayer, range.startContainer, range.startOffset);
      setStartNonWs(offset);
      setActivePageNum(pageNum);
    } else {
      setStartNonWs(null);
      setActivePageNum(null);
    }
    
    // Sanitize PDF line breaks: replace single newlines (visual wraps) with spaces to prevent artificial TTS pauses.
    // We use a regex that matches a newline surrounded by non-newlines to preserve double newlines (paragraphs).
    const rawText = selection.toString();
    const textToRead = rawText.replace(/([^\r\n])\r?\n([^\r\n])/g, '$1 $2');
    setFullTextToRead(textToRead);
    
    // Use Native TTS if it's a native voice. Otherwise use Edge TTS.
    if (!isEdgeVoice) {
      startNativeSpeech(textToRead);
    } else {
      await startEdgeSpeech(textToRead);
    }
  };

  const startEdgeSpeech = async (text: string) => {
    if (!navigator.onLine) {
      // Fallback to native if offline
      console.warn("Offline: Falling back to native TTS");
      startNativeSpeech(text);
      return;
    }

    setIsLoading(true);
    try {
      const response = await invokePython({
        command: "generate_tts",
        text: text,
        voice: voiceURI
      });

      if (response.status === 'success' && response.audio_b64) {
        setEdgeTimings(response.word_timings || []);
        if (audioElement) {
          audioElement.src = `data:audio/mp3;base64,${response.audio_b64}`;
          audioElement.playbackRate = playbackRate;
          
          // Use a promise catch to handle browser auto-play blocks seamlessly
          audioElement.play().then(() => {
            setIsPlaying(true);
            setIsPaused(false);
          }).catch(err => {
            console.error("Audio play blocked by browser:", err);
            // If Edge audio fails to play due to gesture limits, fallback safely
            startNativeSpeech(text);
          });
        }
      } else {
        console.error("TTS Error:", response.message);
        startNativeSpeech(text); // Fallback on error
      }
    } catch (e: any) {
      console.error("IPC Error:", e);
      // Optional: alert user if it was a real IPC error
      // alert("Edge TTS Failed: " + String(e));
      startNativeSpeech(text); // Fallback on error
    } finally {
      setIsLoading(false);
    }
  };

  const startNativeSpeech = (text: string) => {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    
    const selectedVoice = nativeVoices.find(v => v.voiceURI === voiceURI);
    if (selectedVoice) {
      utterance.voice = selectedVoice;
    } else {
      const fallback = nativeVoices.find(v => v.lang.startsWith('en'));
      if (fallback) utterance.voice = fallback;
    }
    
    utterance.rate = playbackRate;
    
    const fullText = utterance.text;
    
    utterance.onboundary = (e) => {
      if (e.name === 'word' && isWordHighlightingEnabled && startNonWs !== null && activePageNum !== null) {
        const textLayer = document.querySelector(`.textLayer[data-page-number="${activePageNum}"]`) as HTMLElement;
        if (textLayer) {
          const textBefore = fullText.substring(0, e.charIndex);
          const nonWsBefore = textBefore.replace(/\s/g, '').length;
          
          const wordText = fullText.substring(e.charIndex, e.charIndex + e.charLength);
          const nonWsLength = wordText.replace(/\s/g, '').length;
          
          const wordRange = getRangeByNonWs(textLayer, startNonWs + nonWsBefore, nonWsLength);
          
          if (wordRange) {
            const rects = Array.from(wordRange.getClientRects());
            const viewer = document.querySelector('.pdf-scroll-container');
            
            if (viewer && rects.length > 0) {
              const viewerRect = viewer.getBoundingClientRect();
              const textLayerRect = textLayer.getBoundingClientRect();
              const scaleAttr = textLayer.style.getPropertyValue('--scale-factor');
              const scale = scaleAttr ? parseFloat(scaleAttr) : 1.0;
              
              const relativeRects = rects.map(r => ({
                top: (r.top - textLayerRect.top) / scale,
                left: (r.left - textLayerRect.left) / scale,
                width: r.width / scale,
                height: r.height / scale
              }));
              
              setTtsHighlight({ pageNum: activePageNum, rects: relativeRects });
              
              // Auto-scroll if the word just went out of view bounds
              const firstRect = rects[0];
              if (firstRect.top < viewerRect.top || firstRect.bottom > viewerRect.bottom) {
                viewer.scrollBy({ top: firstRect.top - viewerRect.top - viewerRect.height / 2, behavior: 'smooth' });
              }
            }
          }
        }
      }
    };
    
    utterance.onend = () => {
      setIsPlaying(false);
      setIsPaused(false);
      setTtsHighlight(null);
    };

    window.speechSynthesis.speak(utterance);
    setIsPlaying(true);
    setIsPaused(false);
  };

  const pause = () => {
    if (audioElement) audioElement.pause();
    window.speechSynthesis.pause(); // Always pause native just in case
    setIsPaused(true);
    setIsPlaying(false);
  };

  const stop = () => {
    if (audioElement) {
      audioElement.pause();
      audioElement.currentTime = 0;
    }
    window.speechSynthesis.cancel(); // Always cancel native speech to stop fallbacks!
    setIsPlaying(false);
    setIsPaused(false);
    setStartNonWs(null);
    setActivePageNum(null);
    setTtsHighlight(null);
  };

  const cyclePlaybackRate = () => {
    const rates = [0.75, 1.0, 1.25, 1.5, 2.0];
    const currentIndex = rates.indexOf(playbackRate);
    const nextRate = rates[(currentIndex + 1) % rates.length];
    setPlaybackRate(nextRate);
    
    // Apply instantly if currently playing Edge TTS
    if (isEdgeVoice && audioElement && isPlaying) {
      audioElement.playbackRate = nextRate;
    }
    
    // Note: Native SpeechSynthesis can't reliably change rate mid-speech without restarting on most browsers, 
    // so we'll just let it apply to the next speech segment for native voices.
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
      <button 
        onClick={cyclePlaybackRate}
        style={{
          background: 'var(--bs-surface)',
          color: 'var(--bs-text)',
          border: '1px solid var(--bs-border)',
          borderRadius: '4px',
          padding: '2px 6px',
          fontSize: '0.8rem',
          cursor: 'pointer',
          fontWeight: 'bold',
          minWidth: '45px'
        }}
        title="Playback Speed"
      >
        {playbackRate}x
      </button>

      <select 
        value={voiceURI} 
        onChange={(e) => setVoiceURI(e.target.value)}
        style={{
          background: 'var(--bs-surface)',
          color: 'var(--bs-text)',
          border: '1px solid var(--bs-border)',
          borderRadius: '4px',
          padding: '2px 4px',
          fontSize: '0.8rem',
          maxWidth: '120px'
        }}
      >
        <optgroup label="Premium Voices (Online)">
          {EDGE_VOICES.map(v => (
            <option key={v.voiceURI} value={v.voiceURI}>
              {v.name}
            </option>
          ))}
        </optgroup>
        <optgroup label="System Voices (Offline)">
          {nativeVoices.filter(v => v.lang.startsWith('en')).map(v => (
            <option key={v.voiceURI} value={v.voiceURI}>
              {v.name}
            </option>
          ))}
        </optgroup>
      </select>
      
      {isLoading ? (
        <button className="icon-btn" title="Generating Audio..." disabled><Loader size={18} className="spin" /></button>
      ) : isPlaying ? (
        <button onClick={pause} className="icon-btn" title="Pause"><Pause size={18} /></button>
      ) : (
        <button onClick={speak} className="icon-btn" title="Read Aloud"><Play size={18} /></button>
      )}
      
      {activeView !== 'notes' && (
        <button 
          onClick={() => {
            setIsWordHighlightingEnabled(!isWordHighlightingEnabled);
          }}
          className="icon-btn" 
          title={`Word Highlighting: ${isWordHighlightingEnabled ? 'ON' : 'OFF'}`}
          style={{
            background: isWordHighlightingEnabled ? 'var(--bs-accent)' : 'transparent',
            color: isWordHighlightingEnabled ? 'var(--bs-bg)' : 'var(--bs-text)'
          }}
        >
          <Type size={18} />
        </button>
      )}

      {(isPlaying || isPaused) && (
        <button onClick={stop} className="icon-btn" title="Stop"><Square size={18} /></button>
      )}
    </div>
  );
}
