import json
import os
from typing import Dict, Any, Optional
from ai_clients import get_ai_client

JSON_SCHEMA = """{
  "chapter_title": "string",
  "chapter_number": "integer or null",
  "summary": "string (narrative recap of the chapter)",
  "teachings": [
    {
      "technique": "string",
      "explanation": "string"
    }
  ],
  "core_lesson": "string (the single most actionable insight)",
  "implementation_steps": ["string", "string"],
  "supporting_quotes": ["string", "string"],
  "obsidian_tags": ["string (e.g., #strategy, #power)"],
  "difficulty_to_implement": "string (Easy, Medium, or Hard)"
}"""

SYSTEM_PROMPT = f"""You are BookSage, an expert book analyst and knowledge extractor.
Your task is to analyze a book chapter and extract its core insights, teachings, and actionable lessons.
You MUST output ONLY valid JSON matching this exact schema:
{JSON_SCHEMA}

Do not wrap the JSON in Markdown backticks or include any conversational text. Return only the raw JSON object.
"""

def extract_lesson(chapter_file_path: str, provider: str, api_key: str) -> Dict[str, Any]:
    """Extracts a structured lesson from a chapter text file."""
    
    if not os.path.exists(chapter_file_path):
        raise FileNotFoundError(f"Chapter file not found: {chapter_file_path}")
        
    with open(chapter_file_path, 'r', encoding='utf-8') as f:
        chapter_text = f.read()
        
    client = get_ai_client(provider, api_key)
    
    prompt = f"Analyze the following chapter and extract the requested JSON payload:\n\n{chapter_text}"
    
    # First attempt
    try:
        response_text = client.generate_json(prompt, SYSTEM_PROMPT)
        # Clean up any potential markdown formatting the LLM might have ignored instructions about
        response_text = response_text.strip()
        if response_text.startswith("```json"):
            response_text = response_text[7:]
        if response_text.startswith("```"):
            response_text = response_text[3:]
        if response_text.endswith("```"):
            response_text = response_text[:-3]
            
        return json.loads(response_text)
    except json.JSONDecodeError as e:
        print(f"First attempt failed to parse JSON: {str(e)}. Retrying...")
        
        # One-shot retry
        retry_prompt = (
            f"Your previous response failed to parse as valid JSON. "
            f"The error was: {str(e)}\n\n"
            f"Please try again. Return ONLY valid JSON matching the schema for this text:\n\n{chapter_text}"
        )
        
        retry_response = client.generate_json(retry_prompt, SYSTEM_PROMPT)
        retry_response = retry_response.strip()
        if retry_response.startswith("```json"):
            retry_response = retry_response[7:]
        if retry_response.startswith("```"):
            retry_response = retry_response[3:]
        if retry_response.endswith("```"):
            retry_response = retry_response[:-3]
            
        return json.loads(retry_response)

def process_chapter(chapter_file_path: str, provider: str, api_key: str) -> str:
    """Extracts lesson and saves it alongside the text file."""
    result_json = extract_lesson(chapter_file_path, provider, api_key)
    
    # Save the output
    base_name = os.path.splitext(os.path.basename(chapter_file_path))[0]
    dir_name = os.path.dirname(chapter_file_path)
    output_path = os.path.join(dir_name, f"{base_name}.json")
    
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(result_json, f, indent=2, ensure_ascii=False)
        
    return output_path
