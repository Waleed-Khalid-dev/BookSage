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
                sentence = chunk['text']
                offset = chunk['offset'] / 10_000_000 # to seconds
                duration = chunk['duration'] / 10_000_000 # to seconds
                
                # Find words and their char offsets within the sentence
                words = []
                for match in re.finditer(r'\S+', sentence):
                    words.append({
                        'word': match.group(),
                        'char_start': len(text_so_far) + match.start(),
                        'char_end': len(text_so_far) + match.end(),
                    })
                
                if len(words) > 0:
                    duration_per_word = duration / len(words)
                    for i, w in enumerate(words):
                        w['time_start'] = offset + (i * duration_per_word)
                        w['time_end'] = w['time_start'] + duration_per_word
                        timings.append(w)
                
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
