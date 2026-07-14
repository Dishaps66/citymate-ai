# Architecture

CityMate AI is a monorepo with `apps/web`, `apps/api`, `supabase`, and `docs`.

```mermaid
flowchart LR
  User["User"] --> Web["Next.js App Router"]
  Web --> API["FastAPI API"]
  API --> Sources["Open APIs: Nominatim, Overpass, OSRM, Open-Meteo"]
  API --> DB["Supabase PostgreSQL + RLS + pgvector"]
  API --> Agents["Supervisor + Tool Agents"]
  Agents --> Guard["Verification and Hallucination Guard"]
  Guard --> API
```

The backend owns live provider access so browser code does not hit public Nominatim directly. All factual responses use a shared envelope with `sources`, `retrieved_at`, `freshness`, `warnings`, and `unavailable_fields`.

## Agent Workflow

```mermaid
flowchart TD
  Request["User request"] --> Intent["Intent classifier"]
  Intent --> Supervisor["Supervisor agent"]
  Supervisor --> Context["User context agent"]
  Supervisor --> Live["Live data agent"]
  Supervisor --> Travel["Travel agent"]
  Supervisor --> Housing["Accommodation agent"]
  Supervisor --> Budget["Budget agent"]
  Supervisor --> Weather["Weather agent"]
  Supervisor --> Rag["RAG agent"]
  Context --> Verify["Verification guard"]
  Live --> Verify
  Travel --> Verify
  Housing --> Verify
  Budget --> Verify
  Weather --> Verify
  Rag --> Verify
  Verify --> Compose["Structured answer with sources"]
```

Independent retrieval should run in parallel once LangGraph is connected. The verification guard blocks unsupported factual claims.
