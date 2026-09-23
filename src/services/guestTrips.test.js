import { describe, expect, it } from "vitest";
import { loadGuestTrips, removeGuestTrip, saveGuestTrips } from "./guestTrips";

function createStorage() {
  const values = new Map();
  return {
    getItem(key) {
      return values.get(key) ?? null;
    },
    setItem(key, value) {
      values.set(key, value);
    },
  };
}

describe("guest trip storage", () => {
  it("round-trips a trip list", () => {
    const storage = createStorage();
    const trips = [{ id: "1", source: "A", destination: "B" }];

    expect(saveGuestTrips(trips, storage)).toBe(true);
    expect(loadGuestTrips(storage)).toEqual(trips);
  });

  it("removes one trip without changing the others", () => {
    const trips = [
      { id: "1", source: "A", destination: "B" },
      { id: "2", source: "C", destination: "D" },
    ];

    expect(removeGuestTrip(trips, "1")).toEqual([trips[1]]);
  });
});
