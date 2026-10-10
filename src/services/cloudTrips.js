const TRIP_COLUMNS = "id,user_id,source_name,destination_name,travellers,days_count,data_status,created_at,updated_at,itinerary,context,note";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function mapCloudTrip(row) {
  const context = row.context && typeof row.context === "object" ? row.context : null;
  return {
    id: row.id,
    storage: "cloud",
    createdAt: row.created_at,
    source: row.source_name,
    destination: row.destination_name,
    travellers: row.travellers,
    days: row.days_count || 3,
    dataStatus: row.data_status || "UNAVAILABLE",
    context,
    ai: row.itinerary && typeof row.itinerary === "object" ? row.itinerary : null,
    budget: context?.budget || {
      status: "UNAVAILABLE",
      message: "Live booking prices were not saved because no authorized fares provider is connected.",
    },
    note: row.note || "Saved to your TripMate account.",
  };
}

export async function listCloudTrips(client, userId) {
  const { data, error } = await client
    .from("trips")
    .select(TRIP_COLUMNS)
    .eq("user_id", userId)
    .order("updated_at", { ascending: false })
    .limit(100);
  if (error) throw new Error(error.message || "Could not load your saved trips.");
  return (data || []).map(mapCloudTrip);
}

export async function saveCloudTrip(client, userId, trip) {
  const payload = {
    user_id: userId,
    source_name: String(trip.source || "").trim(),
    destination_name: String(trip.destination || "").trim(),
    travellers: Math.max(1, Math.min(30, Number(trip.travellers) || 1)),
    days_count: Math.max(1, Math.min(60, Number(trip.days) || 3)),
    status: "PLANNED",
    data_status: trip.dataStatus || "UNAVAILABLE",
    budget_total: null,
    budget_per_person: null,
    currency: "INR",
    itinerary: trip.ai && typeof trip.ai === "object" ? trip.ai : null,
    context: trip.context && typeof trip.context === "object" ? trip.context : null,
    note: String(trip.note || "").slice(0, 2000),
    updated_at: new Date().toISOString(),
  };
  if (!payload.source_name || !payload.destination_name) {
    throw new Error("A saved trip needs both a source and destination.");
  }
  if (UUID_PATTERN.test(String(trip.id || ""))) payload.id = trip.id;

  const { data, error } = await client
    .from("trips")
    .upsert(payload, { onConflict: "id" })
    .select(TRIP_COLUMNS)
    .single();
  if (error) throw new Error(error.message || "Could not save your trip to the cloud.");
  return mapCloudTrip(data);
}

export async function deleteCloudTrip(client, userId, tripId) {
  const { error } = await client
    .from("trips")
    .delete()
    .eq("id", tripId)
    .eq("user_id", userId);
  if (error) throw new Error(error.message || "Could not delete your saved trip.");
}
