// src/services/dictionaryService.ts
// Free Dictionary API client + SQLite caching for instant definitions

import { getCachedWordDefinition, saveCachedWordDefinition } from './dbService';

export interface DefinitionItem {
  definition: string;
  example?: string;
  synonyms?: string[];
}

export interface MeaningItem {
  partOfSpeech: string;
  definitions: DefinitionItem[];
}

export interface WordDefinitionData {
  word: string;
  phonetic?: string;
  audioUrl?: string;
  meanings: MeaningItem[];
  bookContext?: string;
  source: 'cache' | 'api' | 'fallback';
}

/**
 * Clean a word token extracted from a text click.
 * Strips punctuation, quotes, trailing apostrophes.
 */
export function cleanWordToken(raw: string): string {
  if (!raw) return '';
  return raw
    .trim()
    .replace(/^[^a-zA-Z0-9]+|[^a-zA-Z0-9]+$/g, '')
    .toLowerCase();
}

/**
 * Look up word definition:
 * 1. Checks SQLite cache.
 * 2. Fetches from free dictionaryapi.dev.
 * 3. Saves to cache on success.
 */
export async function lookupWordDefinition(rawWord: string): Promise<WordDefinitionData | null> {
  const word = cleanWordToken(rawWord);
  if (!word || word.length < 2) return null;

  // 1. Check local SQLite cache first
  try {
    const cached = await getCachedWordDefinition(word);
    if (cached) {
      let meanings: MeaningItem[] = [];
      try {
        meanings = JSON.parse(cached.meanings_json);
      } catch (e) {
        console.warn('Failed to parse cached meanings JSON:', e);
      }

      if (meanings.length > 0) {
        return {
          word: cached.word,
          phonetic: cached.phonetic || undefined,
          audioUrl: cached.audio_url || undefined,
          meanings,
          bookContext: cached.ai_context_json || undefined,
          source: 'cache'
        };
      }
    }
  } catch (err) {
    console.warn('Cache lookup failed, proceeding to network:', err);
  }

  // 2. Fetch from Free Dictionary API
  try {
    const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`, {
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(4000)
    });

    if (!res.ok) {
      return null;
    }

    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) {
      return null;
    }

    const entry = data[0];
    const phonetic = entry.phonetic || entry.phonetics?.find((p: any) => p.text)?.text || '';
    
    // Find audio file with mp3 extension
    let audioUrl: string | undefined = undefined;
    if (Array.isArray(entry.phonetics)) {
      const audioEntry = entry.phonetics.find((p: any) => p.audio && p.audio.endsWith('.mp3'));
      if (audioEntry) {
        audioUrl = audioEntry.audio;
      }
    }

    const meanings: MeaningItem[] = (entry.meanings || []).map((m: any) => ({
      partOfSpeech: m.partOfSpeech || 'general',
      definitions: (m.definitions || []).slice(0, 3).map((d: any) => ({
        definition: d.definition,
        example: d.example || undefined,
        synonyms: Array.isArray(d.synonyms) ? d.synonyms.slice(0, 4) : undefined
      }))
    }));

    const result: WordDefinitionData = {
      word,
      phonetic: phonetic || undefined,
      audioUrl,
      meanings,
      source: 'api'
    };

    // 3. Persist to cache asynchronously
    saveCachedWordDefinition({
      word,
      phonetic: result.phonetic,
      meanings_json: JSON.stringify(result.meanings),
      audio_url: result.audioUrl
    }).catch(e => console.warn('Failed to save word definition cache:', e));

    return result;
  } catch (err) {
    console.warn('Free Dictionary API lookup failed:', err);
    return null;
  }
}
