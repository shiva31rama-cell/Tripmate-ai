import asyncio
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
CACHE_TTL_SECONDS = max(30, int(os.getenv("CACHE_TTL_SECONDS", "900")))
NOMINATIM_MIN_INTERVAL_SECONDS = max(1.0, float(os.getenv("NOMINATIM_MIN_INTERVAL_SECONDS", "1.1")))
_nominatim_lock = asyncio.Lock()
_last_nominatim_request = 0.0


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
    # Public Nominatim requires at most one request per second.
    global _last_nominatim_request
    async with _nominatim_lock:
        wait = NOMINATIM_MIN_INTERVAL_SECONDS - (time.monotonic() - _last_nominatim_request)
        if wait > 0:
            await asyncio.sleep(wait)
        try:
            data = await get_json(
                client, f"{NOMINATIM_URL}/search",
                params={"q": query, "format": "jsonv2", "limit": 1, "addressdetails": 1},
                timeout=15,
            )
        finally:
            _last_nominatim_request = time.monotonic()
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
            "checkedAt": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
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
        result = json.loads(data.get("message", {}).get("content", "{}"))
        if not isinstance(result, dict):
            raise ValueError("AI response must be a JSON object")
        result.setdefault("summary", "Itinerary generated from available source data.")
        result.setdefault("days", [])
        result.setdefault("budgetNotes", [])
        result.setdefault("dataWarnings", [])
        if not isinstance(result["days"], list):
            result["days"] = []
        if not isinstance(result["dataWarnings"], list):
            result["dataWarnings"] = []
        result["budgetNotes"] = [
            "Live booking fares and availability are unavailable until an authorized provider is connected."
        ]
        return result
    except (httpx.HTTPError, json.JSONDecodeError, KeyError, ValueError) as exc:
        raise HTTPException(status_code=503, detail="Local AI planner unavailable or returned invalid JSON.") from exc


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
        # Locations must be verified; never invent coordinates on geocoding failure.
        try:
            source = await geocode(client, source_text)
            destination = await geocode(client, destination_text)
        except HTTPException:
            raise
        except (httpx.HTTPError, json.JSONDecodeError, KeyError, ValueError, TypeError, IndexError) as exc:
            raise HTTPException(status_code=503, detail="Location verification is temporarily unavailable or returned invalid data. Please retry later.") from exc

        if (
            (source.get("placeId") is not None and source.get("placeId") == destination.get("placeId"))
            or (
                abs(source["latitude"] - destination["latitude"]) < 0.0001
                and abs(source["longitude"] - destination["longitude"]) < 0.0001
            )
        ):
            raise HTTPException(status_code=400, detail="Source and destination resolve to the same verified place. Explore this city locally instead.")

        # Providers fail independently. Optional data outages should not erase verified context.
        route_data: dict[str, Any] = {
            "status": "UNAVAILABLE", "provider": "OSRM",
            "message": "Driving route could not be verified right now.",
            "sourceUrl": "https://project-osrm.org/",
        }
        places: list[dict[str, Any]] = []
        weather_data: dict[str, Any] | None = None
        try:
            route_data = await route(client, source, destination)
        except (httpx.HTTPError, HTTPException, json.JSONDecodeError, KeyError, ValueError, TypeError, IndexError):
            pass
        try:
            places = await nearby_places(client, destination)
        except (httpx.HTTPError, HTTPException, KeyError, ValueError):
            places = []
        try:
            weather_data = await weather(client, destination)
        except (httpx.HTTPError, HTTPException, KeyError, ValueError):
            weather_data = None

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
            "providerWarnings": [
                message for condition, message in [
                    (route_data.get("status") == "UNAVAILABLE", "Driving route unavailable; try again later."),
                    (not places, "No nearby places were returned. This may mean no mapped results or a temporary provider issue."),
                    (weather_data is None, "Current weather unavailable."),
                ] if condition
            ],
        }
        ai_result = None
        try:
            ai_result = await create_ai_plan(context)
        except HTTPException:
            context["providerWarnings"].append("Local AI is unavailable; source-backed context is still available.")

    return {
        "status": "LIVE",
        "context": context,
        "ai": ai_result,
        "sources": [
            "https://www.openstreetmap.org/",
            "https://project-osrm.org/",
            "https://overpass-api.de/",
            "https://open-meteo.com/",
        ],
        "checkedAt": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
    }
