import { describe, expect, it } from "vitest";
import { createDemoTrip } from "./tripPlanner";

describe("createDemoTrip", () => {
  it("blocks same-location intercity trips", () => {
    const result = createDemoTrip({
      from: "Chennai",
      to: "Chennai",
      travellers: 2,
      days: 3,
    });

    expect(result.ok).toBe(false);
    expect(result.validation.code).toBe("SAME_LOCATION");
  });

  it("creates a structured demo trip for a valid route", () => {
    const result = createDemoTrip({
      from: "Bhimavaram",
      to: "Madurai",
      travellers: 4,
      days: 5,
    });

    expect(result.ok).toBe(true);
    expect(result.trip.dataStatus).toBe("DEMO");
  });
});
