/**
 * Everyday Phonetic Respelling Engine for BookSage
 * Converts raw academic IPA symbols (e.g. /ˈstɹætədʒi/, /ˈɛv.ɹi.wʌn/, /əˈfɛkʃən/)
 * into clean, natural English pronunciation respelling (e.g. STRAT-uh-jee, EV-ree-wun, uh-FEK-shun).
 */

const VOWEL_PHONEMES = [
  'aɪə', 'aʊə', 'eɪ', 'aɪ', 'ɔɪ', 'aʊ', 'oʊ', 'əʊ', 'juː', 'ju', 'iː', 'uː',
  'ɔːr', 'ɔː', 'ɑːr', 'ɑː', 'ɜːr', 'ɜː', 'ɛər', 'eər', 'eə', 'ɪər', 'ɪə',
  'ʊər', 'ʊə', 'ɪ', 'ɛ', 'e', 'æ', 'ɑ', 'ɒ', 'ɔ', 'ʊ', 'ʌ', 'ə', 'ɝ', 'ɚ', 'i', 'u'
].sort((a, b) => b.length - a.length);

const VOWEL_REGEX = new RegExp(VOWEL_PHONEMES.join('|'), 'g');

const PHONEME_MAP: Record<string, string> = {
  // Diphthongs & Triphthongs
  'aɪə': 'eye-uh',
  'aʊə': 'ow-uh',
  'eɪ': 'ay',
  'aɪ': 'eye',
  'ɔɪ': 'oy',
  'aʊ': 'ow',
  'oʊ': 'oh',
  'əʊ': 'oh',
  'juː': 'yoo',
  'ju': 'yoo',
  'iː': 'ee',
  'uː': 'oo',
  'ɔːr': 'or',
  'ɔː': 'aw',
  'ɑːr': 'ar',
  'ɑː': 'ah',
  'ɜːr': 'ur',
  'ɜː': 'ur',
  'ɛər': 'air',
  'eər': 'air',
  'eə': 'air',
  'ɪər': 'eer',
  'ɪə': 'eer',
  'ʊər': 'oor',
  'ʊə': 'oor',

  // Consonant clusters & Affricates
  'tʃ': 'ch',
  'dʒ': 'j',
  'hw': 'wh',
  'ʍ': 'wh',
  'ʃ': 'sh',
  'ʒ': 'zh',
  'θ': 'th',
  'ð': 'th',
  'ŋ': 'ng',

  // Single Vowels
  'ɪ': 'ih',
  'ɛ': 'eh',
  'e': 'eh',
  'æ': 'a',
  'ɑ': 'ah',
  'ɒ': 'ah',
  'ɔ': 'aw',
  'ʊ': 'oo',
  'ʌ': 'uh',
  'ə': 'uh',
  'ɝ': 'ur',
  'ɚ': 'er',
  'i': 'ee',
  'u': 'oo',

  // Consonants
  'ɹ': 'r',
  'ɡ': 'g'
};

const SORTED_KEYS = Object.keys(PHONEME_MAP).sort((a, b) => b.length - a.length);
const TOKEN_REGEX = new RegExp(SORTED_KEYS.map(k => k.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')).join('|'), 'g');

/**
 * Splits an IPA string into syllable chunks.
 * Handles both dot-separated IPA (/ˈɛv.ɹi.wʌn/) and undelimited IPA (/ˈstɹætədʒi/).
 */
function syllabifyIpa(ipa: string): string[] {
  const s = ipa.replace(/^[\/\[]|[\/\]]$/g, '').trim();

  // If already dot-delimited by the dictionary
  if (s.includes('.')) {
    return s.split('.').filter(Boolean);
  }

  // Find all vowel spans
  const matches: { start: number; end: number; vowel: string }[] = [];
  let m: RegExpExecArray | null;
  while ((m = VOWEL_REGEX.exec(s)) !== null) {
    matches.push({ start: m.index, end: m.index + m[0].length, vowel: m[0] });
  }

  if (matches.length <= 1) {
    return [s];
  }

  const syllables: string[] = [];
  let prevSplit = 0;

  for (let i = 0; i < matches.length - 1; i++) {
    const curVowel = matches[i];
    const nextVowel = matches[i + 1];
    const cluster = s.slice(curVowel.end, nextVowel.start);

    const stressIdx = cluster.indexOf('ˈ');
    const secStressIdx = cluster.indexOf('ˌ');
    const splitStress = stressIdx !== -1 ? stressIdx : secStressIdx;

    let splitOffset: number;
    if (splitStress !== -1) {
      // Split immediately before the stress mark
      splitOffset = curVowel.end + splitStress;
    } else {
      // Indivisible digraphs go with following vowel onset
      if (['dʒ', 'tʃ', 'hw', 'ʃ', 'θ', 'ð', 'ŋ'].includes(cluster)) {
        splitOffset = curVowel.end;
      } else if (cluster.length <= 1) {
        // Short checked vowels (æ, ɛ, e, ɪ, ʌ, ɒ) capture single consonant into coda
        if (['æ', 'ɛ', 'e', 'ɪ', 'ʌ', 'ɒ'].includes(curVowel.vowel) && cluster.length === 1) {
          splitOffset = curVowel.end + 1;
        } else {
          splitOffset = curVowel.end;
        }
      } else {
        // Multi-consonant cluster: split roughly evenly
        splitOffset = curVowel.end + Math.floor(cluster.length / 2);
      }
    }

    syllables.push(s.slice(prevSplit, splitOffset));
    prevSplit = splitOffset;
  }
  syllables.push(s.slice(prevSplit));

  return syllables.filter(Boolean);
}

/**
 * Naturalizes phonetic syllables for standard everyday reading (Merriam-Webster / Kindle style).
 */
function polishSyllable(syl: string): string {
  let s = syl;
  // Naturalize suffix endings
  s = s.replace(/sheh?k?shuhn/gi, 'shun').replace(/shuhn$/gi, 'shun');
  s = s.replace(/ehkt$/gi, 'ekt');
  s = s.replace(/ehk$/gi, 'ek');
  s = s.replace(/eh([vktnszmpb])/gi, 'e$1');
  s = s.replace(/ih([j])/gi, 'i$1');
  s = s.replace(/wuhn/gi, 'wun');
  s = s.replace(/^([fbpvkgtd])l$/i, '$1uhl');
  s = s.replace(/ooh/gi, 'oo');
  s = s.replace(/uhr/gi, 'er');
  return s;
}

/**
 * Main converter: transforms raw IPA strings into readable Everyday Phonetic Respelling.
 * E.g.:
 *  "/ˈstɹætədʒi/"    => "STRAT-uh-jee"
 *  "/ˈɛv.ɹi.wʌn/"     => "EV-ree-wun"
 *  "/əˈfɛkʃən/"       => "uh-FEK-shun"
 *  "/bəˈnɛvələnt/"    => "buh-NEV-uh-luhnt"
 *  "/dɪˈrekt/"        => "dih-REKT"
 */
export function formatPhoneticRespelling(rawIpa?: string | null): string {
  if (!rawIpa) return '';
  const s = rawIpa.trim();
  if (!s) return '';

  // If already in standard respelling format (e.g. STRAT-uh-jee or uh-FEK-shun)
  const stripped = s.replace(/^[\/\[]|[\/\]]$/g, '').trim();
  if (/^[A-Za-z\s\-']+$/.test(stripped) && (stripped.includes('-') || stripped === stripped.toUpperCase())) {
    return stripped;
  }

  // Decompose into syllables
  const syllables = syllabifyIpa(stripped);

  const formatted = syllables.map(syl => {
    const isStressed = syl.includes('ˈ');
    const clean = syl.replace(/[ˈˌ]/g, '');
    let res = clean.replace(TOKEN_REGEX, match => PHONEME_MAP[match] || match);
    // Remove non-ASCII phonetic diacritics
    res = res.replace(/[^a-zA-Z]/g, '');
    res = polishSyllable(res);
    if (!res) return '';
    return isStressed ? res.toUpperCase() : res.toLowerCase();
  }).filter(Boolean);

  if (formatted.length === 0) {
    return stripped;
  }

  return formatted.join('-');
}
