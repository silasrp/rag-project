# RAG Pipeline over Documentation

A retrieval-augmented generation pipeline that lets you ask natural language questions over technical documentation and get accurate, context-grounded answers in real time. Built with a pgvector database for semantic search and OpenAI embeddings for document retrieval.

🔗 **[Live Demo](https://rag-project-gamma.vercel.app/)** · 📂 **[Backend](https://railway.com/project/477f3a65-62ab-4e12-a1d7-2dab87a21344)**

---

## What problem does this solve?

Technical documentation is notoriously hard to search. Keyword search misses context, and reading through pages to find one answer wastes time. This project lets you ask a question the way you'd ask a colleague — in plain English — and get a precise, grounded answer pulled directly from the source material. No hallucinations, no guessing.

---

## Stack

| Layer | Technology |
|---|---|
| Embeddings & LLM | OpenAI `text-embedding-3-small` + `GPT-4o-mini` |
| RAG orchestration | LangChain |
| Vector store | PGVector (PostgreSQL) |
| Backend API | FastAPI (Python) |
| Frontend | Next.js 14 (App Router) |
| Streaming | Server-Sent Events (SSE) |
| Backend hosting | Railway |
| Frontend hosting | Vercel |

---

## Architecture

The system is split into two pipelines: an offline ingestion pipeline that runs once (or whenever docs change), and an online query pipeline that runs on every user request.

<img width="1132" height="866" alt="image" src="https://github.com/user-attachments/assets/985931eb-6425-4c0b-83f8-925e557492fa" />


### Ingestion pipeline (offline)

```
Raw docs (.md) → Chunker → Embedder → Vector store
```

**1. Raw docs**
Documentation is stored as Markdown files in the `/docs` directory. Markdown is ideal because it preserves structure (headings, code blocks, lists) that helps the chunker make meaningful splits.

**2. Chunker**
Documents are split using LangChain's `RecursiveCharacterTextSplitter` with a chunk size of 512 tokens and a 64-token overlap. The recursive strategy tries to split on natural boundaries (paragraphs, then sentences, then words) rather than cutting arbitrarily. The overlap ensures context isn't lost at chunk edges.

**3. Embedder**
Each chunk is passed through OpenAI's `text-embedding-3-small` model, which converts the text into a 1536-dimensional vector. These vectors encode semantic meaning — chunks about similar topics end up close together in vector space regardless of exact wording.

**4. Vector store**
Vectors and their source chunks are stored in PostgreSQL using the `pgvector` extension, managed by `langchain-postgres`. Using Postgres as the vector store (rather than a dedicated vector DB) keeps the infrastructure simple without sacrificing performance at this scale.

---

### Query pipeline (online)

```
User query → Embed query → Retrieve top-5 → LLM + context → Streamed answer
```

**1. User query**
The user types a natural language question in the Next.js frontend and submits it.

**2. Embed query**
The query is embedded using the same `text-embedding-3-small` model used during ingestion. This is critical — both the query and the stored chunks must live in the same vector space for similarity search to work.

**3. Retrieve top-5**
The query vector is compared against all stored chunk vectors using cosine similarity. The 5 closest chunks are retrieved — these are the most semantically relevant passages from the documentation.

**4. LLM + context**
The retrieved chunks are injected into a prompt alongside the original question and sent to `GPT-4o-mini`. The prompt explicitly instructs the model to answer using only the provided context, preventing hallucination.

**5. Streamed answer**
The LLM response is streamed token-by-token back to the frontend using Server-Sent Events (SSE), giving users real-time feedback rather than waiting for the full response.

---

### Delivery layer

```
Next.js (Vercel) → API route proxy → FastAPI (Railway) → Streaming SSE
```

**Next.js frontend (Vercel)**
The UI is a Next.js 14 app using the App Router. It handles user input, initiates the SSE stream, and renders the answer as it arrives. Deployed on Vercel for edge CDN delivery and zero-config Next.js optimisation.

**API route proxy**
Next.js API routes proxy requests from the frontend to the FastAPI backend. This keeps the backend URL private (not exposed to the browser) and allows environment-specific routing via `NEXT_PUBLIC_API_URL`.

**FastAPI backend (Railway)**
The Python backend orchestrates the full RAG chain using LangChain. It exposes a single `/query` POST endpoint that returns a streaming SSE response. Deployed on Railway alongside the PostgreSQL + pgvector database.

---

## How it works

Here's a concrete example of a single request flowing through the system:

1. User types: *"How do I configure chunk overlap in LangChain?"*
2. The frontend sends a POST request to `/api/query` (Next.js API route)
3. The API route forwards it to the FastAPI backend on Railway
4. FastAPI embeds the question using `text-embedding-3-small` → produces a 1536-dim vector
5. PGVector runs a cosine similarity search across all stored chunk vectors
6. The 5 most relevant chunks are retrieved — e.g. passages from the splitter docs
7. Those chunks are injected into the prompt: *"Answer using ONLY this context: [chunks]"*
8. GPT-4o-mini generates a response, streaming tokens as they're produced
9. FastAPI yields each token as an SSE event: `data: token\n\n`
10. The Next.js frontend reads the stream and appends each token to the UI in real time
11. The user sees the answer appear word by word, grounded in the actual documentation

---

## Project structure

```
rag-project/
├── backend/
│   ├── api.py          # FastAPI app — /query endpoint with SSE streaming
│   ├── main.py         # LangChain RAG chain — retriever, prompt, LLM
│   ├── ingest.py       # Ingestion script — load, chunk, embed, store
│   ├── docs/           # Source documentation (.md files)
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── app/
│   │   ├── page.tsx            # Main UI — question input + streaming answer
│   │   └── api/query/
│   │       └── route.ts        # API route proxy to FastAPI backend
│   ├── package.json
│   └── .env.local.example
└── README.md
```

---

## Running locally

### Prerequisites

- Python 3.11+
- Node.js 18+
- An OpenAI API key with Model capabilities → Write scope

### 1. Clone the repo

```bash
git clone https://github.com/your-username/rag-project.git
cd rag-project
```

### 2. Set up the backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env       # add your OPENAI_API_KEY
```

### 3. Run ingestion

```bash
python ingest.py
# → Indexed N chunks from N documents
```

Only needs to run once, or whenever your docs change.

### 4. Start the backend

```bash
uvicorn api:app --reload --port 8000
# → FastAPI running at http://localhost:8000
# → Swagger UI at http://localhost:8000/docs
```

### 5. Start the frontend

```bash
cd ../frontend
npm install
cp .env.local.example .env.local  # set NEXT_PUBLIC_API_URL=http://localhost:8000
npm run dev
# → Next.js running at http://localhost:3000
```

---

## Environment variables

### Backend (`.env`)

```bash
OPENAI_API_KEY=sk-...
DATABASE_URL=postgresql+psycopg://user:password@host:port/dbname
```

### Frontend (`.env.local`)

```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

## Deployment

| Service | Platform | Config |
|---|---|---|
| Frontend | Vercel | Auto-deploy from `main`, set `NEXT_PUBLIC_API_URL` |
| Backend + DB | Railway | FastAPI service + PostgreSQL add-on, set `OPENAI_API_KEY` + `DATABASE_URL` |

Vercel and Railway both auto-deploy on every push to `main`. The ingestion script runs as a one-off Railway job — trigger it manually from the Railway dashboard after the first deploy, and re-run it whenever docs are updated.

---

## Design decisions worth noting

**Why PGVector over Pinecone?**
For a documentation-scale index, Postgres with pgvector is operationally simpler (one less external service), free on Railway's hobby plan, and more than sufficient in performance. Pinecone becomes relevant at millions of vectors or when sub-10ms retrieval is critical — neither applies here.

**Why chunk overlap?**
A 64-token overlap between chunks means no sentence is ever split in half without context on both sides. Without overlap, a chunk boundary in the middle of an explanation would produce two low-quality chunks that each miss the full picture.

**Why stream the response?**
Waiting 5–10 seconds for a full LLM response hurts the user experience significantly. Streaming token-by-token gives immediate feedback and makes the app feel fast even when the full response takes time.

**Why GPT-4o-mini over GPT-4o?**
For Q&A over structured documentation, the quality difference is minimal and the cost difference is substantial. GPT-4o-mini handles factual retrieval tasks well when the context is already provided.

---

## License

MIT
