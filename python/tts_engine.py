import os
import asyncio
import tempfile
import base64
import edge_tts

async def _generate_audio_async(text: str, voice: str, output_path: str):
    communicate = edge_tts.Communicate(text, voice)
    await communicate.save(output_path)

def generate_audio_b64(text: str, voice: str) -> str:
    """
    Synchronous wrapper to generate audio using edge_tts and return as base64.
    """
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix='.mp3') as tmp:
            tmp_path = tmp.name
            
        asyncio.run(_generate_audio_async(text, voice, tmp_path))
        
        with open(tmp_path, 'rb') as f:
            b64_data = base64.b64encode(f.read()).decode('utf-8')
            
        os.remove(tmp_path)
        return b64_data
    except Exception as e:
        print(f"Error generating TTS: {e}")
        return None
