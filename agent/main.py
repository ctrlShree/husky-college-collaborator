from fastapi import FastAPI, Header, HTTPException
from dotenv import load_dotenv
from pydantic import BaseModel
import os

from gemini_client import get_embedding
from supabase_client import supabase

load_dotenv()

app = FastAPI()

class WebhookPayload(BaseModel):
    type: str
    table: str
    record: dict

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

    embedding = get_embedding(combined_text)

    supabase.table("projects").update({"embedding": embedding}).eq("id", project_id).execute()

    return {"status": "embedded", "project_id": project_id}