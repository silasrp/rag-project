import os
import re
import shutil
import subprocess
import sys

from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI, UploadFile, HTTPException
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from langchain_openai import OpenAIEmbeddings
from langchain_postgres import PGVector
from main import chain

_dir = os.path.dirname(os.path.abspath(__file__))
MAX_FILE_SIZE = 50 * 1024  # 50 KB

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://your-app.vercel.app"],  # update after Vercel deploy
    allow_methods=["*"],
    allow_headers=["*"],
)

# Track the latest ingestion subprocess
_ingest_process: subprocess.Popen | None = None

class Query(BaseModel):
    question: str

@app.post("/query")
async def query_docs(body: Query):
    async def generate():
        async for chunk in chain.astream(body.question):
            yield f"data: {chunk}\n\n"
    return StreamingResponse(generate(), media_type="text/event-stream")


@app.post("/upload")
async def upload_document(file: UploadFile):
    # Validate file extension
    if not file.filename or not file.filename.endswith(".md"):
        raise HTTPException(status_code=400, detail="Only .md files are allowed.")

    # Sanitize filename: allow only alphanumeric, hyphens, underscores, dots
    basename = os.path.basename(file.filename)
    if not re.match(r"^[a-zA-Z0-9_\-]+\.md$", basename):
        raise HTTPException(
            status_code=400,
            detail="Filename must contain only letters, numbers, hyphens, and underscores.",
        )

    # Read and enforce size limit
    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400,
            detail=f"File exceeds the {MAX_FILE_SIZE // 1024}KB size limit.",
        )

    # Save to docs/
    docs_dir = os.path.join(_dir, "docs")
    os.makedirs(docs_dir, exist_ok=True)
    dest = os.path.join(docs_dir, basename)

    with open(dest, "wb") as f:
        f.write(content)

    # Trigger ingestion
    global _ingest_process
    _ingest_process = subprocess.Popen(
        [sys.executable, os.path.join(_dir, "ingest.py")],
        cwd=_dir,
    )

    return {"status": "ok", "filename": basename, "size": len(content)}


@app.get("/ingest-status")
async def ingest_status():
    if _ingest_process is None:
        return {"status": "idle"}
    rc = _ingest_process.poll()
    if rc is None:
        return {"status": "running"}
    if rc == 0:
        return {"status": "completed"}
    return {"status": "failed"}


@app.post("/reset")
def reset_database():
    docs_dir = os.path.join(_dir, "docs")
    archive_dir = os.path.join(_dir, "archive")

    # Move docs to archive
    moved = []
    if os.path.isdir(docs_dir):
        os.makedirs(archive_dir, exist_ok=True)
        for filename in os.listdir(docs_dir):
            if filename.endswith(".md"):
                src = os.path.join(docs_dir, filename)
                dest = os.path.join(archive_dir, filename)
                shutil.move(src, dest)
                moved.append(filename)

    # Delete the PGVector collection
    try:
        db_url = os.environ["DATABASE_URL"].replace(
            "postgresql+asyncpg://", "postgresql+psycopg://"
        ).replace(
            "postgresql://", "postgresql+psycopg://"
        )
        embeddings = OpenAIEmbeddings(model="text-embedding-3-small")
        vectorstore = PGVector(
            embeddings=embeddings,
            connection=db_url,
            collection_name="tech_docs",
        )
        vectorstore.delete_collection()
    except Exception:
        pass  # Collection may not exist yet

    return {"status": "ok", "archived": moved}


@app.get("/documents")
def list_documents():
    docs_dir = os.path.join(_dir, "docs")
    documents = []
    if os.path.isdir(docs_dir):
        for filename in sorted(os.listdir(docs_dir)):
            if not filename.endswith(".md"):
                continue
            filepath = os.path.join(docs_dir, filename)
            try:
                with open(filepath, "r", encoding="utf-8") as f:
                    content = f.read(2048)  # read enough to find a title
                title = _extract_title(content, filename)
                documents.append({"filename": filename, "title": title})
            except Exception:
                documents.append({"filename": filename, "title": filename})
    return {"documents": documents}


def _extract_title(content: str, fallback: str) -> str:
    """Extract a title from markdown content."""
    for line in content.splitlines():
        line = line.strip()
        if not line:
            continue
        # Match markdown headings: # Title
        m = re.match(r"^#{1,3}\s+(.+)$", line)
        if m:
            return m.group(1).strip()
        # Match bold title lines: **Title**
        m = re.match(r"^\*\*(.+?)\*\*\s*$", line)
        if m:
            return m.group(1).strip()
    # Fallback: filename without extension
    return fallback.replace(".md", "").replace("-", " ").replace("_", " ").title()