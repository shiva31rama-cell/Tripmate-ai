const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: { Accept: "application/json", ...(options.headers || {}) },
  });
  let payload = null;
  try { payload = await response.json(); } catch {}
  if (!response.ok) throw new Error(payload?.detail || `TripMate service error: ${response.status}`);
  return payload;
}

export async function buildLiveTrip({ from, to, travellers, days, signal }) {
  return request("/api/trip-context", {
    method: "POST",
    signal,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ from, to, travellers, days }),
  });
}

export async function searchMapPlaces({ query, category = "places", signal }) {
  return request("/api/places/search", {
    method: "POST",
    signal,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, category }),
  });
}

export async function searchLocalGuide({ latitude, longitude, radiusMeters = 1000, signal }) {
  if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90 ||
      !Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
    throw new Error("A valid location is required to search nearby places.");
  }
  return request("/api/local-guide", {
    method: "POST",
    signal,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ latitude, longitude, radiusMeters }),
  });
}

export { API_BASE_URL };
