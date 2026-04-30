"""
AIQTP RAG Service — OpenClaw Knowledge Gateway
================================================
FastAPI service providing /ingest, /search, /answer endpoints.
Ingests GitHub repos from repos.yaml, embeds with Ollama/OpenAI,
stores in Qdrant, and serves tiered semantic search.

Endpoints:
  POST /ingest          Clone/pull all repos, chunk, embed, store in Qdrant
  POST /search          Semantic search with tier + tag filters
  POST /answer          LLM answer synthesized from retrieved chunks
  GET  /status          Ingest status and collection stats
  POST /ingest/trigger  Trigger background re-ingest
"""

import asyncio
import hashlib
import logging
import os
import re
import subprocess
import textwrap
from pathlib import Path
from typing import Any, Optional

import httpx
import yaml
from fastapi import BackgroundTasks, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from qdrant_client import QdrantClient
from qdrant_client.http.models import (
    Distance,
    FieldCondition,
    Filter,
    MatchAny,
    MatchValue,
    PointStruct,
    VectorParams,
)

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
log = logging.getLogger("rag-service")

# ─── Config ───────────────────────────────────────────────────────────────────
QDRANT_URL      = os.getenv("QDRANT_URL", "http://localhost:6333")
OLLAMA_URL      = os.getenv("OLLAMA_URL", "http://localhost:11434")
EMBEDDING_MODEL = os.getenv("EMBEDDING_MODEL", "nomic-embed-text")
LLM_MODEL       = os.getenv("LLM_MODEL", "llama3")
OPENAI_API_KEY  = os.getenv("OPENAI_API_KEY", "")
GITHUB_TOKEN    = os.getenv("GITHUB_TOKEN", "")
REPOS_DIR       = Path(os.getenv("REPOS_DIR", "/app/repos"))
REPOS_YAML      = Path(os.getenv("REPOS_YAML", "/app/repos.yaml"))
COLLECTION      = "quantclaw_rag"
CHUNK_SIZE      = 800
CHUNK_OVERLAP   = 100
TOP_K           = 8

INGESTABLE_EXTS = {
    ".py", ".ts", ".tsx", ".js", ".jsx", ".sol", ".rs", ".md",
    ".rst", ".ipynb", ".toml", ".yaml", ".yml",
}
SKIP_DIRS = {"node_modules", "dist", "build", ".git", "__pycache__", ".next", "venv", ".venv"}
MAX_FILE_BYTES = 500_000  # skip files > 500KB

# ─── App ──────────────────────────────────────────────────────────────────────
app = FastAPI(title="AIQTP RAG Service", version="1.0.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

qdrant = QdrantClient(url=QDRANT_URL)
_ingest_status: dict[str, Any] = {"state": "idle", "progress": 0, "total": 0, "errors": []}


# ─── Models ───────────────────────────────────────────────────────────────────
class SearchRequest(BaseModel):
    query: str
    tiers: list[int] = [1, 2]
    tags: list[str] = []
    top_k: int = TOP_K

class AnswerRequest(BaseModel):
    query: str
    tiers: list[int] = [1, 2]
    tags: list[str] = []

class IngestRequest(BaseModel):
    tiers: list[int] = [1, 2]
    force: bool = False


# ─── Embedding ────────────────────────────────────────────────────────────────
async def embed(text: str) -> list[float]:
    if OPENAI_API_KEY:
        async with httpx.AsyncClient() as client:
            r = await client.post(
                "https://api.openai.com/v1/embeddings",
                headers={"Authorization": f"Bearer {OPENAI_API_KEY}"},
                json={"input": text[:8000], "model": "text-embedding-3-small"},
                timeout=30,
            )
            r.raise_for_status()
            return r.json()["data"][0]["embedding"]
    else:
        async with httpx.AsyncClient() as client:
            r = await client.post(
                f"{OLLAMA_URL}/api/embeddings",
                json={"model": EMBEDDING_MODEL, "prompt": text[:4000]},
                timeout=60,
            )
            r.raise_for_status()
            return r.json()["embedding"]


async def llm_complete(prompt: str) -> str:
    if OPENAI_API_KEY:
        async with httpx.AsyncClient() as client:
            r = await client.post(
                "https://api.openai.com/v1/chat/completions",
                headers={"Authorization": f"Bearer {OPENAI_API_KEY}"},
                json={"model": "gpt-4o-mini", "messages": [{"role": "user", "content": prompt}], "max_tokens": 1024},
                timeout=60,
            )
            r.raise_for_status()
            return r.json()["choices"][0]["message"]["content"]
    else:
        async with httpx.AsyncClient() as client:
            r = await client.post(
                f"{OLLAMA_URL}/api/generate",
                json={"model": LLM_MODEL, "prompt": prompt, "stream": False},
                timeout=120,
            )
            r.raise_for_status()
            return r.json()["response"]


# ─── Chunking ─────────────────────────────────────────────────────────────────
def chunk_text(text: str, size: int = CHUNK_SIZE, overlap: int = CHUNK_OVERLAP) -> list[str]:
    words = text.split()
    chunks, i = [], 0
    while i < len(words):
        chunk = " ".join(words[i : i + size])
        if chunk.strip():
            chunks.append(chunk)
        i += size - overlap
    return chunks


# ─── Qdrant helpers ───────────────────────────────────────────────────────────
def ensure_collection(vector_size: int = 768) -> None:
    collections = [c.name for c in qdrant.get_collections().collections]
    if COLLECTION not in collections:
        qdrant.create_collection(
            collection_name=COLLECTION,
            vectors_config=VectorParams(size=vector_size, distance=Distance.COSINE),
        )
        log.info("Created Qdrant collection: %s (dim=%d)", COLLECTION, vector_size)


# ─── Ingest ───────────────────────────────────────────────────────────────────
def clone_or_pull(repo_url: str, dest: Path) -> None:
    headers = f"https://{GITHUB_TOKEN}@" if GITHUB_TOKEN else "https://"
    auth_url = repo_url.replace("https://", headers)
    if dest.exists():
        subprocess.run(["git", "-C", str(dest), "pull", "--ff-only"], capture_output=True)
    else:
        subprocess.run(["git", "clone", "--depth=1", auth_url, str(dest)], capture_output=True)


def iter_files(repo_dir: Path):
    for path in repo_dir.rglob("*"):
        if path.is_file() and path.suffix in INGESTABLE_EXTS:
            if not any(skip in path.parts for skip in SKIP_DIRS):
                if path.stat().st_size <= MAX_FILE_BYTES:
                    yield path


async def ingest_repo(repo: dict, repo_dir: Path) -> int:
    points: list[PointStruct] = []
    for file_path in iter_files(repo_dir):
        try:
            text = file_path.read_text(errors="ignore")
        except Exception:
            continue
        rel = str(file_path.relative_to(repo_dir))
        for i, chunk in enumerate(chunk_text(text)):
            chunk_id = hashlib.md5(f"{repo['url']}:{rel}:{i}".encode()).hexdigest()
            vec = await embed(chunk)
            if not vec:
                continue
            points.append(PointStruct(
                id=int(chunk_id[:8], 16),
                vector=vec,
                payload={
                    "repo":   repo["url"].split("/")[-1],
                    "repo_url": repo["url"],
                    "tier":   repo["tier"],
                    "tags":   repo.get("tags", []),
                    "file":   rel,
                    "chunk":  i,
                    "text":   chunk[:500],
                    "reference_only": repo.get("reference_only", False),
                },
            ))
            if len(points) >= 100:
                qdrant.upsert(collection_name=COLLECTION, points=points)
                points = []
    if points:
        qdrant.upsert(collection_name=COLLECTION, points=points)
    return len(points)


async def run_ingest(tiers: list[int], force: bool = False) -> None:
    global _ingest_status
    with open(REPOS_YAML) as f:
        manifest = yaml.safe_load(f)
    repos = [r for r in manifest["repos"] if r["tier"] in tiers]
    _ingest_status = {"state": "running", "progress": 0, "total": len(repos), "errors": []}

    # Detect vector size from first embed
    probe = await embed("test")
    ensure_collection(vector_size=len(probe))

    REPOS_DIR.mkdir(parents=True, exist_ok=True)
    for idx, repo in enumerate(repos):
        repo_name = repo["url"].split("/")[-1]
        dest = REPOS_DIR / repo_name
        try:
            clone_or_pull(repo["url"], dest)
            await ingest_repo(repo, dest)
            log.info("[%d/%d] Ingested %s (tier %d)", idx + 1, len(repos), repo_name, repo["tier"])
        except Exception as exc:
            log.warning("Ingest failed for %s: %s", repo_name, exc)
            _ingest_status["errors"].append(f"{repo_name}: {exc}")
        _ingest_status["progress"] = idx + 1

    _ingest_status["state"] = "done"
    log.info("Ingest complete. %d repos processed.", len(repos))


# ─── Routes ───────────────────────────────────────────────────────────────────
@app.get("/status")
async def status():
    try:
        info = qdrant.get_collection(COLLECTION)
        count = info.points_count
    except Exception:
        count = 0
    return {**_ingest_status, "qdrant_points": count, "collection": COLLECTION}


@app.post("/ingest")
async def ingest(req: IngestRequest, background_tasks: BackgroundTasks):
    if _ingest_status["state"] == "running":
        raise HTTPException(409, "Ingest already running")
    background_tasks.add_task(run_ingest, req.tiers, req.force)
    return {"status": "started", "tiers": req.tiers}


@app.post("/ingest/trigger")
async def ingest_trigger(background_tasks: BackgroundTasks):
    if _ingest_status["state"] != "running":
        background_tasks.add_task(run_ingest, [1, 2], False)
    return {"status": "triggered"}


@app.post("/search")
async def search(req: SearchRequest):
    vec = await embed(req.query)
    if not vec:
        raise HTTPException(500, "Embedding failed")

    filters = []
    if req.tiers:
        filters.append(FieldCondition(key="tier", match=MatchAny(any=req.tiers)))
    if req.tags:
        filters.append(FieldCondition(key="tags", match=MatchAny(any=req.tags)))

    qfilter = Filter(must=filters) if filters else None
    results = qdrant.search(
        collection_name=COLLECTION,
        query_vector=vec,
        limit=req.top_k,
        query_filter=qfilter,
        with_payload=True,
    )
    return {
        "query": req.query,
        "results": [
            {
                "score":    r.score,
                "repo":     r.payload.get("repo"),
                "file":     r.payload.get("file"),
                "tier":     r.payload.get("tier"),
                "tags":     r.payload.get("tags"),
                "text":     r.payload.get("text"),
                "reference_only": r.payload.get("reference_only", False),
            }
            for r in results
        ],
    }


@app.post("/answer")
async def answer(req: AnswerRequest):
    search_resp = await search(SearchRequest(query=req.query, tiers=req.tiers, tags=req.tags))
    chunks = "\n\n---\n\n".join(
        f"[{r['repo']} / {r['file']}]\n{r['text']}"
        for r in search_resp["results"]
        if not r.get("reference_only")
    )
    prompt = textwrap.dedent(f"""
        You are QuantClaw, an expert quant trading AI. Using ONLY the code and documents below,
        answer the question concisely. If the answer isn't in the provided context, say so.

        QUESTION: {req.query}

        CONTEXT:
        {chunks}

        ANSWER:
    """).strip()
    response = await llm_complete(prompt)
    return {"query": req.query, "answer": response, "sources": search_resp["results"]}


@app.on_event("startup")
async def startup():
    log.info("RAG Service starting — Qdrant: %s  Ollama: %s", QDRANT_URL, OLLAMA_URL)
    # Auto-ingest Tier 1+2 on first start if collection is empty
    asyncio.create_task(auto_ingest_if_empty())


async def auto_ingest_if_empty():
    await asyncio.sleep(10)  # wait for Qdrant to be ready
    try:
        info = qdrant.get_collection(COLLECTION)
        if info.points_count == 0:
            log.info("Collection empty — starting initial Tier 1+2 ingest...")
            await run_ingest([1, 2])
    except Exception:
        log.info("Collection not found — starting initial Tier 1+2 ingest...")
        await run_ingest([1, 2])


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=int(os.getenv("PORT", 8001)))
