import { describe, expect, it } from "vitest";
import { mapCloudTrip } from "./cloudTrips";

describe("mapCloudTrip", () => {
  it("maps a stored itinerary back into the app trip model", () => {
    const trip = mapCloudTrip({
      id: "d2be2d91-d2bb-43dd-83e0-a3ce60afc23c",
      created_at: "2026-10-10T10:00:00.000Z",
      source_name: "Kadapa",
      destination_name: "Tirupati",
      travellers: 3,
      days_count: 2,
      data_status: "LIVE",
      itinerary: { summary: "A sourced plan", days: [] },
      context: { budget: { status: "UNAVAILABLE" }, nearbyPlaces: [] },
      note: "Open-data trip",
    });
    expect(trip.source).toBe("Kadapa");
    expect(trip.destination).toBe("Tirupati");
    expect(trip.days).toBe(2);
    expect(trip.storage).toBe("cloud");
    expect(trip.ai.summary).toBe("A sourced plan");
    expect(trip.budget.status).toBe("UNAVAILABLE");
  });

  it("does not invent booking budget data when context is missing", () => {
    const trip = mapCloudTrip({
      id: "d2be2d91-d2bb-43dd-83e0-a3ce60afc23c",
      source_name: "A",
      destination_name: "B",
      travellers: 1,
      days_count: 1,
    });
    expect(trip.budget.status).toBe("UNAVAILABLE");
    expect(trip.budget.total).toBeUndefined();
  });
});
