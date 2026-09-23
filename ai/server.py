import json
import os
from typing import Any

import httpx
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

app = FastAPI(title="TripMate AI Service", version="0.1.0")
OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "qwen2.5:7b")


class TripRequest(BaseModel):
    context: dict[str, Any] = Field(default_factory=dict)


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok", "model": OLLAMA_MODEL}


@app.post("/api/plan")
async def plan(request: TripRequest) -> dict[str, Any]:
    prompt = {
        "task": "Create a practical itinerary from supplied facts.",
        "rules": [
            "Use only supplied facts for factual claims.",
            "Never invent prices, schedules, availability, distances, opening hours, booking status or sources.",
            "Preserve LIVE, VERIFIED_SNAPSHOT, ESTIMATED, DEMO and UNAVAILABLE statuses.",
            "If information is unavailable, include it in dataWarnings.",
            "Return JSON only with summary, days, budgetNotes and dataWarnings.",
        ],
        "trip_context": request.context,
    }

    payload = {
        "model": OLLAMA_MODEL,
        "stream": False,
        "format": "json",
        "messages": [
            {
                "role": "system",
                "content": "You are TripMate AI. You organize verified travel data; you do not fabricate missing facts.",
            },
            {"role": "user", "content": json.dumps(prompt)},
        ],
        "options": {"temperature": 0.2},
    }

    try:
        async with httpx.AsyncClient(timeout=120) as client:
            response = await client.post(f"{OLLAMA_BASE_URL}/api/chat", json=payload)
            response.raise_for_status()
    except httpx.HTTPError as exc:
        raise HTTPException(status_code=503, detail=f"Local AI service unavailable: {exc}") from exc

    data = response.json()
    content = data.get("message", {}).get("content", "{}")
    try:
        result = json.loads(content)
    except json.JSONDecodeError as exc:
        raise HTTPException(status_code=502, detail="AI returned invalid JSON") from exc

    return {
        "status": "AI_GENERATED",
        "model": OLLAMA_MODEL,
        "result": result,
    }
