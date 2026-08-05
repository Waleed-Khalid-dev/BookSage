import { useState, useEffect, useRef } from 'react';
import { Play, Pause, Square, Loader } from 'lucide-react';
import { invokePython } from '../../services/pythonService';

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
  const audioRef = useRef<HTMLAudioElement | null>(null);

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

    const selection = window.getSelection()?.toString();
    const textToRead = selection || "Please select some text to read aloud.";
    
    if (isEdgeVoice) {
      await startEdgeSpeech(textToRead);
    } else {
      startNativeSpeech(textToRead);
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

  const startNativeSpeech = (text: string) => {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    
    const selectedVoice = nativeVoices.find(v => v.voiceURI === voiceURI);
    if (selectedVoice) {
      utterance.voice = selectedVoice;
    } else {
      // If Edge voice was selected but we fell back, just use a default english native voice
      const fallback = nativeVoices.find(v => v.lang.startsWith('en'));
      if (fallback) utterance.voice = fallback;
    }
    
    utterance.rate = playbackRate;
    
    utterance.onend = () => {
      setIsPlaying(false);
      setIsPaused(false);
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
      
      {(isPlaying || isPaused) && (
        <button onClick={stop} className="icon-btn" title="Stop"><Square size={18} /></button>
      )}
    </div>
  );
}
