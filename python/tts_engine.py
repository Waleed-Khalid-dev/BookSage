import os
import asyncio
import tempfile
import base64
import edge_tts
import re

async def _generate_audio_async(text: str, voice: str, output_path: str):
    comm = edge_tts.Communicate(text, voice)
    timings = []
    text_so_far = ''
    
    with open(output_path, 'wb') as f:
        async for chunk in comm.stream():
            if chunk['type'] == 'audio':
                f.write(chunk['data'])
            elif chunk['type'] == 'SentenceBoundary':
                sentence = chunk['text'].strip()
                offset = chunk['offset'] / 10_000_000 # to seconds
                duration = chunk['duration'] / 10_000_000 # to seconds
                
                idx = text.find(sentence, len(text_so_far))
                char_start_base = idx if idx != -1 else len(text_so_far)
                
                # Find words and their char offsets within the sentence
                words = []
                for match in re.finditer(r'\S+', sentence):
                    words.append({
                        'word': match.group(),
                        'char_start': char_start_base + match.start(),
                        'char_end': char_start_base + match.end(),
                        'length': match.end() - match.start()
                    })
                
                if len(words) > 0:
                    # Character-proportional timing: longer words get more time
                    total_chars = sum(w['length'] for w in words)
                    current_time = offset
                    
                    for w in words:
                        # Add a tiny base time per word to account for natural pauses between words
                        word_duration = (w['length'] / total_chars) * duration
                        w['time_start'] = current_time
                        w['time_end'] = current_time + word_duration
                        current_time += word_duration
                        
                        # We also attach the sentence boundaries to the word, so the frontend can choose to highlight the word OR the sentence!
                        w['sentence_char_start'] = char_start_base
                        w['sentence_char_end'] = char_start_base + len(sentence)
                        
                        timings.append(w)
                
                if idx != -1:
                    text_so_far = text[:idx + len(sentence)]
                else:
                    text_so_far += sentence + ' '
                
    return timings

def generate_audio_b64(text: str, voice: str) -> dict:
    """
    Synchronous wrapper to generate audio using edge_tts and return as base64 with word timings.
    """
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix='.mp3') as tmp:
            tmp_path = tmp.name
            
        timings = asyncio.run(_generate_audio_async(text, voice, tmp_path))
        
        with open(tmp_path, 'rb') as f:
            b64_data = base64.b64encode(f.read()).decode('utf-8')
            
        os.remove(tmp_path)
        return {"audio_b64": b64_data, "word_timings": timings}
    except Exception as e:
        print(f"Error generating TTS: {e}")
        return None
