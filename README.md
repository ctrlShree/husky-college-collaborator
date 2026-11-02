# Husky College Collaborator (CoCoHusky)

A school-specific platform where students can discover, post, and join projects with their peers — built as a personal/learning project to go deeper into full-stack development.

## The problem

Platforms like LinkedIn connect students to a global audience, but make it hard to find people to actually collaborate with locally. Husky College Collaborator narrows the scope to a single school (verified via school email), making it easier to find real, reachable collaborators for class projects, personal builds, or just people interested in the same field.

## Features

- **School-verified auth** — signup restricted to a specific email domain, enforced server-side via a Supabase auth hook
- **Post projects** — title, description, tech stack, roles needed, GitHub link, and multiple images
- **Browse & search** — full-text search (title, description, tech stack, roles) plus filters for affiliation, status, and meeting mode
- **Request to join** — requesters can apply for a specific role; project owners review, accept, or decline
- **Automatic team membership** — accepting a request adds the person to the project's team with their requested role
- **Profiles** — editable bio/skills/links, avatar upload, and a public view showing a user's owned and joined projects
- **Project management** — owners can edit project details, add/remove images, or delete the project
- **AI-powered search ("Ask AI")** — ask natural-language questions like "find me a React project that needs a backend developer" and get grounded, relevant results. Built with Google Gemini (embeddings + generation) and pgvector for semantic search, combined with structured filters. Includes hallucination guardrails: if nothing relevant is found, the system returns an honest "no results" message without ever calling the LLM to speculate.

## Tech stack

- **Frontend:** React (Vite), React Router
- **Backend:** Express.js
- **AI Agent:** Python (FastAPI), Google Gemini (gemini-3.5-flash-lite for generation, gemini-embedding-001 for embeddings)
- **Database & Auth:** Supabase (PostgreSQL + Auth + Storage + pgvector)
- **Email:** Brevo (custom SMTP for Supabase auth emails)
- **Hosting:** Vercel (frontend), Render (Express backend + Python agent service)

## Project structure

```
husky-collaborator/
  client/          React frontend (Vite)
    src/
      pages/       Route-level components (Browse, Profile, PostProject, AskAI, etc.)
      components/  Shared components (Nav, ProtectedRoute)
      context/     AuthContext (session + profile-completeness state)
      lib/         Supabase client setup, API/agent URL config
  server/          Express backend
    routes/        Route definitions
    controllers/   Request handling logic
    middleware/     Auth verification
    lib/           Supabase client setup
  agent/           Python AI agent service (FastAPI)
    main.py        Routes: /embed (webhook), /ask (search)
    gemini_client.py   Gemini embedding + text generation, with caching
    supabase_client.py Supabase client
    auth.py        Token verification matching the main app's auth
```

## How "Ask AI" works

1. A user asks a question in plain language (e.g. "find me a React project that needs a backend developer").
2. Gemini extracts structured search intent from the query (tech, role, meeting mode, general topic).
3. The topic is embedded and compared against pre-computed project embeddings in Postgres (via pgvector) to find semantically similar projects, above a minimum relevance threshold.
4. Results are further narrowed by any specific tech/role/meeting-mode mentioned.
5. **If no projects meet the relevance threshold, the system returns a fixed "no results" message without calling the LLM at all** — this is a deliberate guardrail against hallucination.
6. If results exist, Gemini writes a short summary, explicitly instructed to describe only the real, retrieved projects and invent nothing beyond them. The actual project data shown to the user always comes directly from the database, not from the LLM's text.

Project embeddings are kept up to date automatically: a Supabase Database Webhook calls the agent's `/embed` endpoint whenever a project is created or updated, so there's no manual or scheduled re-indexing step.

## Running locally

### Backend (Express)
```
cd server
npm install
npm run dev
```
Requires a `.env` file with:
```
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
PORT=4000
```

### Frontend
```
cd client
npm install
npm run dev
```
Requires a `.env` file with:
```
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=
VITE_API_URL=
VITE_AGENT_URL=
```

### AI Agent (Python)
```
cd agent
python -m venv venv
venv\Scripts\activate   (or source venv/bin/activate on Mac/Linux)
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```
Requires a `.env` file with:
```
GEMINI_API_KEY=
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
WEBHOOK_SECRET=
PORT=8000
```

## Database

PostgreSQL via Supabase. Four core tables (`profiles`, `projects`, `join_requests`, `project_members`), connected by foreign keys with cascading deletes.

![Database schema](docs/schema.png)

## Status

Actively in development as a personal/learning project. Built solo, end-to-end, including auth design, API design, database schema, and an AI-powered search feature with explicit anti-hallucination guardrails.