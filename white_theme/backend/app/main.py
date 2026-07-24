from pathlib import Path

from datetime import UTC, datetime

from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

from app.api.router import api_router
from app.core.exceptions import register_exception_handlers
from app.core.lifespan import lifespan
from app.core.logging import setup_logging
from app.core.middleware import register_middlewares
from app.ai.search_agent import search_agent

setup_logging()
from app.core.config import settings

print("JSEARCH KEY:", settings.JSEARCH_API_KEY[:10] if settings.JSEARCH_API_KEY else "NOT FOUND")
app = FastAPI(
   debug=True,
   lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

register_middlewares(app)
register_exception_handlers(app)

app.include_router(api_router)


class HealthResponse(BaseModel):
    status: str


class RootResponse(BaseModel):
    message: str


@app.get("/", response_model=RootResponse)
async def root():
    return RootResponse(message="Welcome to OpportunityOS 🚀")


@app.get("/health", response_model=HealthResponse)
async def health():
    return HealthResponse(status="running")


@app.get("/api/jobs")
async def live_jobs(
    q: str = Query("Software Engineer", min_length=1, max_length=200),
    location: str = Query("", max_length=100),
    sources: str = Query("jsearch,remotive,remoteok,arbeitnow"),
):
    """Serve dashboard jobs from the same FastAPI process as the UI."""
    requested = {source.strip().lower() for source in sources.split(",")}
    results = await search_agent.search(query=q.strip(), location=location or None, limit=50)
    for item in results:
        print(item.get("source"), "-", item.get("title"), "-", item.get("location"))
    jobs = []
    for item in results:
        source = item.get("source", "")
        if requested and source.lower().replace(" ", "") not in requested:
            continue
        jobs.append({
            "id": item.get("id"), "title": item.get("title"),
            "company": item.get("company"), "location": item.get("location") or "Remote",
            "salary": item.get("salary") or "Salary not listed",
            "description": item.get("description") or "", "tags": item.get("skills") or [],
            "employmentType": item.get("type") or "Full-time", "source": source,
            "publishedAt": item.get("deadline") or "", "applyLink": item.get("apply_link") or "",
        })
    return {"jobs": jobs, "failedSources": [], "fetchedAt": datetime.now(UTC).isoformat()}


_static_dir = Path(__file__).resolve().parents[2] / "frontend"
if _static_dir.exists():
    app.mount("/app", StaticFiles(directory=str(_static_dir), html=True), name="frontend")
