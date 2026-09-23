const STORAGE_KEY = "tripmate.guest.trips.v1";

export function loadGuestTrips(storage = window.localStorage) {
  try {
    const raw = storage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveGuestTrips(trips, storage = window.localStorage) {
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(Array.isArray(trips) ? trips : []));
    return true;
  } catch {
    return false;
  }
}

export function removeGuestTrip(trips, tripId) {
  return (Array.isArray(trips) ? trips : []).filter((trip) => trip.id !== tripId);
}
