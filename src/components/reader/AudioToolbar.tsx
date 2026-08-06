import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Play, Pause, Square, Loader, Type } from 'lucide-react';
import { invokePython } from '../../services/pythonService';
import { useBookStore } from '../../stores/bookStore';
import { useUiStore } from '../../stores/uiStore';
import { getNonWsOffset, getRangeByNonWs } from '../../utils/domUtils';

const EDGE_VOICES = [
  { voiceURI: 'en-US-AriaNeural', name: 'Aria (Premium Female)', isEdge: true },
  { voiceURI: 'en-US-GuyNeural', name: 'Guy (Premium Male)', isEdge: true },
  { voiceURI: 'en-GB-SoniaNeural', name: 'Sonia (Premium Female)', isEdge: true },
  { voiceURI: 'en-GB-RyanNeural', name: 'Ryan (Premium Male)', isEdge: true },
];

export function AudioToolbar() {
  const isPlaying = useUiStore(state => state.isTtsPlaying);
  const setIsPlaying = useUiStore(state => state.setIsTtsPlaying);
  const setTtsHighlight = useUiStore(state => state.setTtsHighlight);
  const [isPaused, setIsPaused] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [voiceURI, setVoiceURI] = useState<string>('en-US-AriaNeural'); // Default to premium
  const [playbackRate, setPlaybackRate] = useState<number>(1.0);
  const [nativeVoices, setNativeVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [currentRange, setCurrentRange] = useState<Range | null>(null);
  const [startNonWs, setStartNonWs] = useState<number | null>(null);
  const [activePageNum, setActivePageNum] = useState<number | null>(null);
  const [fullTextToRead, setFullTextToRead] = useState<string>('');
  
  const isWordHighlightingEnabled = useBookStore(state => state.isWordHighlightingEnabled);
  const setIsWordHighlightingEnabled = useBookStore(state => state.setIsWordHighlightingEnabled);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const edgeTimingsRef = useRef<any[]>([]);
  const rafRef = useRef<number>();
  const lastWordRef = useRef<number | null>(null);
  
  // Clean up on unmount
  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

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
    const isEdgeVoice = EDGE_VOICES.some(v => v.voiceURI === voiceURI);

    const trackEdgeHighlight = () => {
      if (audioRef.current && isPlaying && isEdgeVoice && fullTextToRead) {
        const currentTime = audioRef.current.currentTime;
        
        // Find current word
        const currentWord = edgeTimingsRef.current.find(w => currentTime >= w.time_start && currentTime <= w.time_end);
        
        // Edge TTS tracking logic using DOM-independent non-whitespace offsets
        if (isWordHighlightingEnabled && startNonWs !== null && activePageNum !== null) {
          if (currentWord) {
            // Performance optimization & zoom stability: 
            // Don't recalculate DOM rects 60 times a second if the word hasn't changed!
            if (lastWordRef.current !== currentWord.char_start) {
              lastWordRef.current = currentWord.char_start;
              const textLayer = document.querySelector(`.textLayer[data-page-number="${activePageNum}"]`) as HTMLElement;
              if (textLayer) {
                // Find how many non-ws chars were spoken before this word
                const textBefore = fullTextToRead.substring(0, currentWord.char_start);
                const nonWsBefore = textBefore.replace(/\s/g, '').length;
                
                const wordText = fullTextToRead.substring(currentWord.char_start, currentWord.char_end);
                const nonWsLength = wordText.replace(/\s/g, '').length;
                
                const wordRange = getRangeByNonWs(textLayer, startNonWs + nonWsBefore, nonWsLength);
                
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
                    
                    setTtsHighlight({ pageNum: activePageNum, rects: relativeRects });
                    
                    const firstRect = rects[0];
                    if (firstRect.top < viewerRect.top || firstRect.bottom > viewerRect.bottom) {
                      viewer.scrollBy({ top: firstRect.top - viewerRect.top - viewerRect.height / 2, behavior: 'smooth' });
                    }
                  }
                }
              }
            }
            // If wordRange fails (e.g. during zoom DOM teardown), do NOT clear it so it doesn't flicker
          } else {
            if (lastWordRef.current !== null) {
              setTtsHighlight(null); // Clear if between words
              lastWordRef.current = null;
            }
          }
        }
      }
      
      rafRef.current = requestAnimationFrame(trackEdgeHighlight);
    };

    if (isPlaying && isWordHighlightingEnabled && isEdgeVoice) {
      rafRef.current = requestAnimationFrame(trackEdgeHighlight);
    } else {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    }

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [isPlaying, isWordHighlightingEnabled, voiceURI, fullTextToRead, startNonWs, activePageNum]);

  useEffect(() => {
    const updateVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices();
      setNativeVoices(availableVoices);
    };

    updateVoices();
    window.speechSynthesis.onvoiceschanged = updateVoices;
    
    // Create audio element for Edge TTS
    audioRef.current = new Audio();
    audioRef.current.preservesPitch = true; // Keep voice pitch normal when speeding up
    audioRef.current.onended = () => {
      setIsPlaying(false);
      setIsPaused(false);
    };
    
    return () => {
      window.speechSynthesis.cancel();
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
    };
  }, []);

  const isEdgeVoice = EDGE_VOICES.some(v => v.voiceURI === voiceURI);

  const speak = async () => {
    if (isPaused) {
      if (isEdgeVoice && audioRef.current) {
        audioRef.current.play();
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
    const textLayer = container.closest('.textLayer') as HTMLElement;
    
    if (textLayer) {
      const pageNum = parseInt(textLayer.getAttribute('data-page-number') || '0', 10);
      const offset = getNonWsOffset(textLayer, range.startContainer, range.startOffset);
      setStartNonWs(offset);
      setActivePageNum(pageNum);
    }
    
    const textToRead = selection.toString();
    setFullTextToRead(textToRead);
    
    // Use Native TTS if it's a native voice. Otherwise use Edge TTS.
    if (!isEdgeVoice) {
      startNativeSpeech(textToRead, selectionRange || undefined);
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
        edgeTimingsRef.current = response.word_timings || [];
        if (audioRef.current) {
          audioRef.current.src = `data:audio/mp3;base64,${response.audio_b64}`;
          audioRef.current.playbackRate = playbackRate;
          audioRef.current.play();
          setIsPlaying(true);
          setIsPaused(false);
        }
      } else {
        console.error("TTS Error:", response.message);
        startNativeSpeech(text); // Fallback on error
      }
    } catch (e) {
      console.error("IPC Error:", e);
      startNativeSpeech(text); // Fallback on error
    } finally {
      setIsLoading(false);
    }
  };

  const startNativeSpeech = (text: string, range?: Range) => {
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
    if (isEdgeVoice && audioRef.current) {
      audioRef.current.pause();
    } else {
      window.speechSynthesis.pause();
    }
    setIsPaused(true);
    setIsPlaying(false);
  };

  const stop = () => {
    if (isEdgeVoice && audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    } else {
      window.speechSynthesis.cancel();
    }
    setIsPlaying(false);
    setIsPaused(false);
    setCurrentRange(null);
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
    if (isEdgeVoice && audioRef.current && isPlaying) {
      audioRef.current.playbackRate = nextRate;
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

      {(isPlaying || isPaused) && (
        <button onClick={stop} className="icon-btn" title="Stop"><Square size={18} /></button>
      )}
    </div>
  );
}
