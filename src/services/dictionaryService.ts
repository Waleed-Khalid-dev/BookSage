import { getCachedWordDefinition, saveCachedWordDefinition } from './dbService';
import { invokePython } from './pythonService';

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
  error?: string;
  source: 'cache' | 'api' | 'fallback';
}

export interface WordLookupOptions {
  bookTitle?: string;
  chapterNum?: number;
  chapterTitle?: string;
  chapterPath?: string;
  surroundingText?: string;
  provider?: string;
  apiKey?: string;
  modelName?: string;
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
 * 2. Fetches from free dictionaryapi.dev (with short timeout).
 * 3. Falls back to AI engine if free dictionary is down / 403 / 522 / missing.
 * 4. Saves to cache on success.
 */
export async function lookupWordDefinition(
  rawWord: string,
  options?: WordLookupOptions
): Promise<WordDefinitionData | null> {
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

  // 2. Fetch from Free Dictionary API (2.5s timeout)
  try {
    const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`, {
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(2500)
    });

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        const entry = data[0];
        const phonetic = entry.phonetic || entry.phonetics?.find((p: any) => p.text)?.text || '';
        
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

        saveCachedWordDefinition({
          word,
          phonetic: result.phonetic,
          meanings_json: JSON.stringify(result.meanings),
          audio_url: result.audioUrl
        }).catch(e => console.warn('Failed to save word definition cache:', e));

        return result;
      }
    }
  } catch (err) {
    console.warn('Free Dictionary API lookup failed/timed out, attempting AI fallback:', err);
  }

  // 3. Robust AI Fallback: if dictionary API failed or returned 404/403/522
  if (options?.apiKey) {
    try {
      const aiRes = await invokePython({
        command: 'word_define_full',
        word,
        book_title: options.bookTitle,
        chapter_num: options.chapterNum,
        chapter_title: options.chapterTitle,
        chapter_path: options.chapterPath,
        surrounding_text: options.surroundingText,
        provider: options.provider || 'gemini',
        api_key: options.apiKey,
        model_name: options.modelName || 'gemini-3.6-flash'
      });

      if (aiRes.status === 'success' && aiRes.result) {
        const r = aiRes.result;

        if (r.error_type === 'rate_limit') {
          return {
            word,
            meanings: [],
            error: r.error_message || 'AI rate limit reached. Wait a moment and retry.',
            source: 'fallback'
          };
        }

        const meanings: MeaningItem[] = (r.meanings || []).map((m: any) => ({
          partOfSpeech: m.partOfSpeech || 'definition',
          definitions: (m.definitions || []).map((d: any) => ({
            definition: d.definition,
            example: d.example || undefined
          }))
        }));

        const result: WordDefinitionData = {
          word,
          phonetic: r.phonetic || undefined,
          meanings,
          bookContext: r.book_context || undefined,
          source: 'fallback'
        };

        if (result.meanings.length > 0) {
          saveCachedWordDefinition({
            word,
            phonetic: result.phonetic,
            meanings_json: JSON.stringify(result.meanings),
            ai_context_json: result.bookContext
          }).catch(() => {});
        }

        return result;
      }
    } catch (aiErr) {
      console.warn('AI word definition fallback failed:', aiErr);
    }
  }

  return null;
}

