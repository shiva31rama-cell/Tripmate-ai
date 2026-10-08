import json
import os
import time
from typing import Any

import httpx
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

app = FastAPI(title="TripMate Open Travel Service", version="0.2.0")

OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434").rstrip("/")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "qwen2.5:7b")
NOMINATIM_URL = os.getenv("NOMINATIM_URL", "https://nominatim.openstreetmap.org").rstrip("/")
OSRM_URL = os.getenv("OSRM_URL", "https://router.project-osrm.org").rstrip("/")
OVERPASS_URL = os.getenv("OVERPASS_URL", "https://overpass-api.de/api/interpreter")
OPEN_METEO_URL = os.getenv("OPEN_METEO_URL", "https://api.open-meteo.com/v1/forecast").rstrip("/")
APP_USER_AGENT = os.getenv("APP_USER_AGENT", "TripMateAI/0.2 (+https://github.com/shiva31rama-cell/Tripmate-ai)")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in os.getenv("CORS_ORIGINS", "*").split(",")],
    allow_credentials=False,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)

_cache: dict[str, tuple[float, Any]] = {}
CACHE_TTL_SECONDS = int(os.getenv("CACHE_TTL_SECONDS", "900"))


class TripRequest(BaseModel):
    from_: str | None = Field(default=None, alias="from")
    to: str
    travellers: int = Field(default=1, ge=1, le=30)
    days: int = Field(default=3, ge=1, le=60)

    class Config:
        populate_by_name = True


class AIRequest(BaseModel):
    context: dict[str, Any] = Field(default_factory=dict)


def cached(key: str) -> Any | None:
    item = _cache.get(key)
    if not item:
        return None
    created, value = item
    if time.time() - created > CACHE_TTL_SECONDS:
        _cache.pop(key, None)
        return None
    return value


def put_cache(key: str, value: Any) -> Any:
    _cache[key] = (time.time(), value)
    return value


async def get_json(client: httpx.AsyncClient, url: str, *, params: dict[str, Any] | None = None, timeout: float = 20) -> Any:
    response = await client.get(
        url,
        params=params,
        headers={"User-Agent": APP_USER_AGENT, "Accept": "application/json"},
        timeout=timeout,
    )
    response.raise_for_status()
    return response.json()


async def geocode(client: httpx.AsyncClient, query: str) -> dict[str, Any]:
    key = f"geocode:{query.strip().lower()}"
    hit = cached(key)
    if hit:
        return hit
    data = await get_json(
        client, f"{NOMINATIM_URL}/search",
        params={"q": query, "format": "jsonv2", "limit": 1, "addressdetails": 1},
    )
    if not data:
        raise HTTPException(status_code=404, detail=f"Could not verify location: {query}")
    item = data[0]
    result = {
        "name": item.get("display_name", query),
        "latitude": float(item["lat"]),
        "longitude": float(item["lon"]),
        "placeId": item.get("osm_id"),
        "provider": "OpenStreetMap Nominatim",
        "status": "LIVE",
        "sourceUrl": "https://www.openstreetmap.org/",
        "checkedAt": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
    }
    return put_cache(key, result)


async def route(client: httpx.AsyncClient, source: dict[str, Any], destination: dict[str, Any]) -> dict[str, Any]:
    key = f"route:{source['latitude']},{source['longitude']}:{destination['latitude']},{destination['longitude']}"
    hit = cached(key)
    if hit:
        return hit
    coordinates = f"{source['longitude']},{source['latitude']};{destination['longitude']},{destination['latitude']}"
    data = await get_json(
        client, f"{OSRM_URL}/route/v1/driving/{coordinates}",
        params={"overview": "false", "alternatives": "false", "steps": "false"},
    )
    if data.get("code") != "Ok" or not data.get("routes"):
        raise HTTPException(status_code=502, detail="Open routing service could not calculate this route.")
    selected = data["routes"][0]
    result = {
        "distanceKm": round(selected["distance"] / 1000, 1),
        "durationMinutes": round(selected["duration"] / 60),
        "provider": "OSRM",
        "status": "LIVE",
        "sourceUrl": "https://project-osrm.org/",
        "checkedAt": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
    }
    return put_cache(key, result)


async def nearby_places(client: httpx.AsyncClient, destination: dict[str, Any]) -> list[dict[str, Any]]:
    lat, lon = destination["latitude"], destination["longitude"]
    key = f"places:{round(lat, 3)}:{round(lon, 3)}"
    hit = cached(key)
    if hit:
        return hit
    query = f"""
[out:json][timeout:20];
(
  nwr(around:7000,{lat},{lon})[tourism];
  nwr(around:7000,{lat},{lon})[amenity=place_of_worship];
);
out center tags;
"""
    response = await client.post(
        OVERPASS_URL, data={"data": query},
        headers={"User-Agent": APP_USER_AGENT, "Accept": "application/json"},
        timeout=30,
    )
    response.raise_for_status()
    results = []
    seen = set()
    for element in response.json().get("elements", []):
        tags = element.get("tags", {})
        name = tags.get("name")
        if not name:
            continue
        identifier = f"{element.get('type')}:{element.get('id')}"
        if identifier in seen:
            continue
        seen.add(identifier)
        center = element.get("center", {})
        results.append({
            "id": identifier,
            "name": name,
            "category": tags.get("tourism") or tags.get("amenity") or "place",
            "latitude": element.get("lat", center.get("lat")),
            "longitude": element.get("lon", center.get("lon")),
            "website": tags.get("website"),
            "phone": tags.get("phone"),
            "provider": "OpenStreetMap Overpass",
            "status": "LIVE",
            "sourceUrl": "https://www.openstreetmap.org/",
        })
        if len(results) >= 20:
            break
    return put_cache(key, results)


async def weather(client: httpx.AsyncClient, destination: dict[str, Any]) -> dict[str, Any] | None:
    key = f"weather:{round(destination['latitude'], 3)}:{round(destination['longitude'], 3)}"
    hit = cached(key)
    if hit:
        return hit
    data = await get_json(
        client, OPEN_METEO_URL,
        params={
            "latitude": destination["latitude"], "longitude": destination["longitude"],
            "current": "temperature_2m,apparent_temperature,precipitation,wind_speed_10m,weather_code",
            "timezone": "auto",
        },
    )
    current = data.get("current")
    if not current:
        return None
    result = {
        "temperatureC": current.get("temperature_2m"),
        "apparentTemperatureC": current.get("apparent_temperature"),
        "precipitationMm": current.get("precipitation"),
        "windSpeedKmh": current.get("wind_speed_10m"),
        "weatherCode": current.get("weather_code"),
        "timezone": data.get("timezone"),
        "provider": "Open-Meteo",
        "status": "LIVE",
        "sourceUrl": "https://open-meteo.com/",
        "checkedAt": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
    }
    return put_cache(key, result)


async def create_ai_plan(context: dict[str, Any]) -> dict[str, Any]:
    prompt = {
        "task": "Create a practical multi-day travel itinerary from supplied structured facts.",
        "rules": [
            "Use only supplied facts for factual claims.",
            "Never invent prices, schedules, availability, distances, opening hours, booking status or sources.",
            "Do not convert missing prices into guesses.",
            "Preserve LIVE, VERIFIED_SNAPSHOT, ESTIMATED, DEMO and UNAVAILABLE statuses.",
            "If important information is unavailable, explain that it must be checked before booking.",
            "Prefer fewer high-confidence activities over fabricated details.",
            "Return JSON only with summary, days, budgetNotes and dataWarnings.",
        ],
        "trip_context": context,
    }
    payload = {
        "model": OLLAMA_MODEL, "stream": False, "format": "json",
        "messages": [
            {"role": "system", "content": "You are TripMate AI, an evidence-first travel planner. You organize validated travel data and never fabricate missing facts."},
            {"role": "user", "content": json.dumps(prompt)},
        ],
        "options": {"temperature": 0.15},
    }
    try:
        async with httpx.AsyncClient(timeout=120) as client:
            response = await client.post(f"{OLLAMA_BASE_URL}/api/chat", json=payload)
            response.raise_for_status()
        data = response.json()
        return json.loads(data.get("message", {}).get("content", "{}"))
    except (httpx.HTTPError, json.JSONDecodeError, KeyError) as exc:
        raise HTTPException(status_code=503, detail=f"Local AI planner unavailable: {exc}") from exc


@app.get("/health")
async def health() -> dict[str, Any]:
    return {"status": "ok", "model": OLLAMA_MODEL, "providers": ["OpenStreetMap Nominatim", "OSRM", "Overpass", "Open-Meteo", "Ollama"]}


@app.post("/api/plan")
async def plan(request: AIRequest) -> dict[str, Any]:
    return {"status": "AI_GENERATED", "model": OLLAMA_MODEL, "result": await create_ai_plan(request.context)}


@app.post("/api/trip-context")
async def trip_context(request: TripRequest) -> dict[str, Any]:
    source_text, destination_text = (request.from_ or "").strip(), request.to.strip()
    if not source_text or not destination_text:
        raise HTTPException(status_code=400, detail="Both source and destination are required.")
    if source_text.casefold() == destination_text.casefold():
        raise HTTPException(status_code=400, detail="Source and destination must be different.")

    async with httpx.AsyncClient() as client:
        try:
            source = await geocode(client, source_text)
            destination = await geocode(client, destination_text)
            route_data = await route(client, source, destination)
            places = await nearby_places(client, destination)
            weather_data = await weather(client, destination)
        except httpx.HTTPError as exc:
            raise HTTPException(status_code=503, detail=f"Open travel data service unavailable: {exc}") from exc

        context = {
            "trip": {"source": source["name"], "destination": destination["name"], "travellers": request.travellers, "days": request.days},
            "route": route_data,
            "destination": destination,
            "nearbyPlaces": places,
            "weather": weather_data,
            "budget": {
                "status": "UNAVAILABLE", "currency": "INR",
                "message": "Live booking fares are not available from the open data layer; connect an authorized provider before showing a fare.",
            },
        }
        ai_result = None
        try:
            ai_result = await create_ai_plan(context)
        except HTTPException:
            ai_result = None

    return {
        "status": "LIVE",
        "context": context,
        "ai": ai_result,
        "sources": ["https://www.openstreetmap.org/", "https://project-osrm.org/", "https://open-meteo.com/"],
    }
