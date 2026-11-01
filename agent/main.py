from fastapi import FastAPI, Header, HTTPException, Depends
from dotenv import load_dotenv
from pydantic import BaseModel
import os
from fastapi.middleware.cors import CORSMiddleware
import hashlib

from gemini_client import get_embedding, generate_text, extract_search_intent
from supabase_client import supabase
from auth import verify_auth

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

class WebhookPayload(BaseModel):
    type: str
    table: str
    record: dict

class AskRequest(BaseModel):
    query: str

@app.get("/")
def health_check():
    return {"message": "Agent service is running"}

@app.post("/embed")
def embed_project(payload: WebhookPayload, x_webhook_secret: str = Header(None)):
    if x_webhook_secret != os.getenv("WEBHOOK_SECRET"):
        raise HTTPException(status_code=401, detail="Invalid webhook secret")

    record = payload.record
    project_id = record.get("id")

    text_parts = [
        record.get("title") or "",
        record.get("description") or "",
        " ".join(record.get("tech_stack") or []),
        " ".join(record.get("roles_needed") or [])
    ]
    combined_text = " ".join(text_parts).strip()

    if not combined_text:
        return {"status": "skipped", "reason": "no text to embed"}

    new_hash = hashlib.sha256(combined_text.encode()).hexdigest()

    existing = supabase.table("projects").select("embedding_source_hash").eq("id", project_id).single().execute()

    if existing.data and existing.data.get("embedding_source_hash") == new_hash:
        return {"status": "skipped", "reason": "content unchanged"}

    embedding = get_embedding(combined_text)

    supabase.table("projects").update({
        "embedding": embedding,
        "embedding_source_hash": new_hash
    }).eq("id", project_id).execute()

    return {"status": "embedded", "project_id": project_id}

@app.post("/ask")
def ask(request: AskRequest, user=Depends(verify_auth)):
    query = request.query.strip()

    if not query:
        raise HTTPException(status_code=400, detail="Query cannot be empty")

    intent = extract_search_intent(query)

    topic_embedding = get_embedding(intent.get("topic") or query)

    result = supabase.rpc("match_projects", {
        "query_embedding": topic_embedding,
        "match_threshold": 0.5,
        "match_count": 5
    }).execute()

    candidates = result.data or []

    if intent.get("tech"):
        tech_lower = intent["tech"].lower()
        candidates = [
            c for c in candidates
            if c.get("tech_stack") and any(tech_lower in t.lower() for t in c["tech_stack"])
        ] or candidates

    if intent.get("role"):
        role_lower = intent["role"].lower()
        candidates = [
            c for c in candidates
            if c.get("roles_needed") and any(role_lower in r.lower() for r in c["roles_needed"])
        ] or candidates

    if intent.get("meeting_mode"):
        filtered = [c for c in candidates if c.get("meeting_mode") == intent["meeting_mode"]]
        if filtered:
            candidates = filtered

    if not candidates:
        return {
            "answer": "I couldn't find any projects matching that. Try different keywords or check the Browse page for the full list.",
            "projects": []
        }

    projects_text = "\n".join([
        f"- {c['title']}: {c['description']}" for c in candidates
    ])

    summary_prompt = f"""A user asked: "{query}"

Here are the ONLY matching projects found in the database:
{projects_text}

Write a brief (1-2 sentence) friendly summary of these results for the user. Only mention projects listed above. Do not invent any details, projects, or information not shown here."""

    answer = generate_text(summary_prompt)

    return {"answer": answer, "projects": candidates}