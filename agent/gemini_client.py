from google import genai
from google.genai import types
import os
import json
from dotenv import load_dotenv

load_dotenv()

client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

_embedding_cache = {}

def get_embedding(text):
    if text in _embedding_cache:
        return _embedding_cache[text]

    result = client.models.embed_content(
        model="gemini-embedding-001",
        contents=text,
        config=types.EmbedContentConfig(output_dimensionality=768)
    )
    embedding = result.embeddings[0].values
    _embedding_cache[text] = embedding
    return embedding

def generate_text(prompt):
    response = client.models.generate_content(
        model="gemini-3.5-flash-lite",
        contents=prompt
    )
    return response.text

def extract_search_intent(query):
    prompt = f"""Extract search intent from this project search query. Return ONLY valid JSON, no other text.

Query: "{query}"

Return JSON with these fields:
- "tech": a specific technology/language mentioned, or null
- "role": a specific role mentioned (like Frontend, Backend, Designer), or null
- "meeting_mode": one of "in_person", "remote", "hybrid", or null if not mentioned
- "topic": a short phrase describing the general subject/theme of what they're looking for (for semantic search)

Example: {{"tech": "React", "role": "Backend", "meeting_mode": null, "topic": "web application with backend work"}}
"""
    response_text = generate_text(prompt)

    try:
        cleaned = response_text.strip().removeprefix("```json").removeprefix("```").removesuffix("```").strip()
        return json.loads(cleaned)
    except (json.JSONDecodeError, ValueError):
        return {"tech": None, "role": None, "meeting_mode": None, "topic": query}