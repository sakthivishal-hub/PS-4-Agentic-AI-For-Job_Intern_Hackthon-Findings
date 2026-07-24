"""
Live opportunity providers for OpportunityOS.

Ports the field-mapping logic already proven working in the Node
frontend server (frontend/server.js: fetchJSearchRaw / fetchRemotiveRaw /
fetchRemoteOkRaw / fetchArbeitnowRaw) into BaseProvider subclasses so the
FastAPI SearchAgent (app/ai/search_agent.py) has real data to return --
previously `search_agent.providers` was always empty and every
/opportunities/search and /recommendations call returned nothing.
"""
from __future__ import annotations

import logging
import re
from typing import Any

from fastapi import params
import httpx

from app.core.config import settings
from app.providers.base import BaseProvider, ProviderError

logger = logging.getLogger(__name__)

_TIMEOUT = httpx.Timeout(10.0)
_HEADERS = {"User-Agent": "OpportunityOS/1.0"}


def _strip_html(value: str = "") -> str:
    return re.sub(r"\s+", " ", re.sub(r"<[^>]*>", " ", value or "")).strip()


async def _get_json(
    url: str,
    headers: dict | None = None,
    params: dict | None = None,
) -> Any:
    async with httpx.AsyncClient(timeout=_TIMEOUT, headers=_HEADERS) as client:
        response = await client.get(
            url,
            headers=headers or {},
            params=params,
        )
        response.raise_for_status()
        return response.json()


class JSearchProvider(BaseProvider):
    """RapidAPI JSearch -- requires JSEARCH_API_KEY."""

    name = "JSearch"

    async def _fetch(self, *, query: str, location: str | None = None, limit: int = 20):
        if not settings.JSEARCH_API_KEY or settings.JSEARCH_API_KEY.startswith("YOUR_"):
            # No key configured -- skip quietly instead of raising, so the
            # other providers still return results.
            return []

        full_query = f"{query} {location or ''}".strip()
        print("JSEARCH QUERY:", full_query)
        try:
            payload = await _get_json(
            "https://jsearch.p.rapidapi.com/search-v2",
            headers={
            "X-RapidAPI-Key": settings.JSEARCH_API_KEY,
            "X-RapidAPI-Host": "jsearch.p.rapidapi.com",
            },
            params={
            "query": full_query,
            "page": 1,
            "num_pages": 1,
            "country":"in",
            "date_posted":"all",
            },
            )
            print("JSEARCH RESULTS:", len(payload.get("data", [])))
        except httpx.HTTPError as exc:
            raise ProviderError(f"JSearch request failed: {exc}") from exc

        results = []
        for job in payload.get("data", []):
            salary = (
                f"{job.get('job_currency', '$')} {job.get('job_min_salary')}"
                if job.get("job_min_salary")
                else ""
            )
            results.append({
                "id": f"jsearch-{job.get('job_id')}",
                "type": "Job",
                "title": job.get("job_title") or "Software Opportunity",
                "company": job.get("employer_name") or "Verified Employer",
                "location": ", ".join(
                    filter(None, [job.get("job_city"), job.get("job_state"), job.get("job_country")])
                ) or ("Remote" if job.get("job_is_remote") else "Location not specified"),
                "salary": salary,
                "description": _strip_html(job.get("job_description", "")),
                "skills": [],
                "deadline": "",
                "apply_link": job.get("job_apply_link") or job.get("job_google_link") or "",
            })
        return results


class RemotiveProvider(BaseProvider):
    """Remotive public API -- no key required."""

    name = "Remotive"

    async def _fetch(self, *, query: str, location: str | None = None, limit: int = 20):
        try:
            payload = await _get_json(f"https://remotive.com/api/remote-jobs?search={query}")
        except httpx.HTTPError as exc:
            raise ProviderError(f"Remotive request failed: {exc}") from exc

        results = []
        for job in payload.get("jobs", [])[:limit]:
            results.append({
                "id": f"remotive-{job.get('id')}",
                "type": "Job",
                "title": job.get("title") or "Remote Developer",
                "company": job.get("company_name") or "Tech Enterprise",
                "location": job.get("candidate_required_location") or "Remote Worldwide",
                "salary": job.get("salary", ""),
                "description": _strip_html(job.get("description", "")),
                "skills": job.get("tags", []) or [],
                "deadline": "",
                "apply_link": job.get("url", ""),
            })
        return results


class RemoteOkProvider(BaseProvider):
    """RemoteOK public API -- no key required."""

    name = "RemoteOK"

    async def _fetch(self, *, query: str, location: str | None = None, limit: int = 20):
        try:
            payload = await _get_json("https://remoteok.com/api")
        except httpx.HTTPError as exc:
            raise ProviderError(f"RemoteOK request failed: {exc}") from exc

        items = payload[1:] if isinstance(payload, list) else []
        query_words = [w for w in query.lower().split() if len(w) > 2]

        results = []
        for job in items:
            haystack = f"{job.get('position', '')} {job.get('description', '')}".lower()
            if query_words and not any(w in haystack for w in query_words):
                continue
            slug = job.get("slug")
            results.append({
                "id": f"remoteok-{job.get('id') or slug}",
                "type": "Job",
                "title": job.get("position") or "Engineering Role",
                "company": job.get("company") or "Remote Innovators",
                "location": job.get("location") or "Remote Worldwide",
                "salary": f"${job.get('salary_min'):,}" if job.get("salary_min") else "",
                "description": _strip_html(job.get("description", "")),
                "skills": job.get("tags", []) or [],
                "deadline": "",
                "apply_link": job.get("url") or (f"https://remoteok.com/remote-jobs/{slug}" if slug else ""),
            })
            if len(results) >= limit:
                break
        return results


class ArbeitnowProvider(BaseProvider):
    """Arbeitnow public API -- no key required."""

    name = "Arbeitnow"

    async def _fetch(self, *, query: str, location: str | None = None, limit: int = 20):
        try:
            payload = await _get_json("https://www.arbeitnow.com/api/job-board-api")
        except httpx.HTTPError as exc:
            raise ProviderError(f"Arbeitnow request failed: {exc}") from exc

        query_words = [w for w in query.lower().split() if len(w) > 2]
        results = []
        for job in payload.get("data", []):
            haystack = f"{job.get('title', '')} {job.get('description', '')}".lower()
            if query_words and not any(w in haystack for w in query_words):
                continue
            results.append({
                "id": f"arbeitnow-{job.get('slug')}",
                "type": "Job",
                "title": job.get("title") or "Tech Specialist",
                "company": job.get("company_name") or "European Tech Firm",
                "location": job.get("location") or ("Remote EU" if job.get("remote") else "Europe"),
                "salary": "",
                "description": _strip_html(job.get("description", "")),
                "skills": job.get("tags", []) or [],
                "deadline": "",
                "apply_link": job.get("url", ""),
            })
            if len(results) >= limit:
                break
        return results


def register_live_providers(agent) -> None:
    """Registers all live providers on the given SearchAgent instance.
    Called once from app.core.lifespan on startup."""
    for provider_cls in (JSearchProvider, RemotiveProvider, RemoteOkProvider, ArbeitnowProvider):
        agent.register(provider_cls())
    logger.info("Registered %d live opportunity providers", len(agent.providers))
