import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Play, Pause, Square, Loader, Type } from 'lucide-react';
import { invokePython } from '../../services/pythonService';
import { useBookStore } from '../../stores/bookStore';
import { getWordRange } from '../../utils/domUtils';

const EDGE_VOICES = [
  { voiceURI: 'en-US-AriaNeural', name: 'Aria (Premium Female)', isEdge: true },
  { voiceURI: 'en-US-GuyNeural', name: 'Guy (Premium Male)', isEdge: true },
  { voiceURI: 'en-GB-SoniaNeural', name: 'Sonia (Premium Female)', isEdge: true },
  { voiceURI: 'en-GB-RyanNeural', name: 'Ryan (Premium Male)', isEdge: true },
];

export function AudioToolbar() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [voiceURI, setVoiceURI] = useState<string>('en-US-AriaNeural'); // Default to premium
  const [playbackRate, setPlaybackRate] = useState<number>(1.0);
  const [nativeVoices, setNativeVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [currentRange, setCurrentRange] = useState<Range | null>(null);
  const [highlightRects, setHighlightRects] = useState<{ top: number; left: number; width: number; height: number }[]>([]);
  
  const isWordHighlightingEnabled = useBookStore(state => state.isWordHighlightingEnabled);
  const setIsWordHighlightingEnabled = useBookStore(state => state.setIsWordHighlightingEnabled);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const edgeTimingsRef = useRef<any[]>([]);
  const rafRef = useRef<number>();
  
  // Clean up on unmount
  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  // Edge TTS Tracking Loop
  useEffect(() => {
    const isEdgeVoice = EDGE_VOICES.some(v => v.voiceURI === voiceURI);

    const trackEdgeHighlight = () => {
      if (audioRef.current && isPlaying && isWordHighlightingEnabled && isEdgeVoice && currentRange) {
        const currentTime = audioRef.current.currentTime;
        
        // Find current word
        const currentWord = edgeTimingsRef.current.find(w => currentTime >= w.time_start && currentTime <= w.time_end);
        
        if (currentWord) {
          const wordRange = getWordRange(currentRange, currentWord.char_start, currentWord.char_end - currentWord.char_start);
          if (wordRange) {
            const rects = Array.from(wordRange.getClientRects());
            const viewer = document.querySelector('.pdf-scroll-container');
            
            if (viewer && rects.length > 0) {
              const viewerRect = viewer.getBoundingClientRect();
              
              const absoluteRects = rects.map(r => ({
                top: r.top - viewerRect.top + viewer.scrollTop,
                left: r.left - viewerRect.left + viewer.scrollLeft,
                width: r.width,
                height: r.height
              }));
              
              setHighlightRects(absoluteRects);
              
              const firstRect = rects[0];
              if (firstRect.top < viewerRect.top || firstRect.bottom > viewerRect.bottom) {
                viewer.scrollBy({ top: firstRect.top - viewerRect.top - viewerRect.height / 2, behavior: 'smooth' });
              }
            }
          }
        } else {
          setHighlightRects([]); // Clear if between words
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
  }, [isPlaying, isWordHighlightingEnabled, voiceURI, currentRange]);

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

    let selectionRange: Range | null = currentRange;
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0 && selection.toString().trim().length > 0) {
      selectionRange = selection.getRangeAt(0).cloneRange();
      setCurrentRange(selectionRange);
    }
    
    const textToRead = selectionRange ? selectionRange.toString() : "Please select some text to read aloud.";
    
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
    
    utterance.onboundary = (e) => {
      if (e.name === 'word' && isWordHighlightingEnabled && range) {
        const wordRange = getWordRange(range, e.charIndex, e.charLength);
        if (wordRange) {
          const rects = Array.from(wordRange.getClientRects());
          const viewer = document.querySelector('.pdf-scroll-container');
          
          if (viewer && rects.length > 0) {
            const viewerRect = viewer.getBoundingClientRect();
            
            // Calculate absolute positions within the scrolling viewer
            const absoluteRects = rects.map(r => ({
              top: r.top - viewerRect.top + viewer.scrollTop,
              left: r.left - viewerRect.left + viewer.scrollLeft,
              width: r.width,
              height: r.height
            }));
            
            setHighlightRects(absoluteRects);
            
            // Auto-scroll if the word just went out of view bounds
            const firstRect = rects[0];
            if (firstRect.top < viewerRect.top || firstRect.bottom > viewerRect.bottom) {
              viewer.scrollBy({ top: firstRect.top - viewerRect.top - viewerRect.height / 2, behavior: 'smooth' });
            }
          }
        }
      }
    };
    
    utterance.onend = () => {
      setIsPlaying(false);
      setIsPaused(false);
      setHighlightRects([]);
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
    setHighlightRects([]);
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
          background: isWordHighlightingEnabled ? 'var(--bs-primary)' : 'transparent',
          color: isWordHighlightingEnabled ? 'white' : 'var(--bs-text)'
        }}
      >
        <Type size={18} />
      </button>

      {(isPlaying || isPaused) && (
        <button onClick={stop} className="icon-btn" title="Stop"><Square size={18} /></button>
      )}
      
      {isWordHighlightingEnabled && isPlaying && typeof document !== 'undefined' && document.querySelector('.pdf-scroll-container') && createPortal(
        <div style={{ pointerEvents: 'none', position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999 }}>
          {highlightRects.map((rect, i) => (
            <div 
              key={i} 
              style={{
                position: 'absolute',
                top: rect.top,
                left: rect.left,
                width: rect.width,
                height: rect.height,
                backgroundColor: 'rgba(255, 223, 0, 0.4)', // transparent yellow
                mixBlendMode: 'multiply',
                borderRadius: '3px',
                transition: 'top 0.1s, left 0.1s, width 0.1s, height 0.1s'
              }} 
            />
          ))}
        </div>,
        document.querySelector('.pdf-scroll-container')!
      )}
    </div>
  );
}
