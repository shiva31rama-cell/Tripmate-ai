import { describe, expect, it } from "vitest";
import { buildTravelSearchLinks } from "./travelLinks";

describe("buildTravelSearchLinks", () => {
  it("returns booking and search handoffs for a complete route", () => {
    const links = buildTravelSearchLinks("Kadapa", "Tirupati");
    expect(links.map((link) => link.id)).toEqual(["trains", "flights", "buses", "stays", "rentals", "places"]);
    expect(links[0].url).toBe("https://www.irctc.co.in/nget/train-search");
    expect(links[1].url).toContain(encodeURIComponent("Kadapa"));
    expect(links[1].url).toContain(encodeURIComponent("Tirupati"));
  });

  it("does not return links for an incomplete route", () => {
    expect(buildTravelSearchLinks("Kadapa", "")).toEqual([]);
  });
});
