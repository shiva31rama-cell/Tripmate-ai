import { describe, expect, it } from "vitest";
import { buildTravelSearchLinks } from "./travelLinks";

describe("buildTravelSearchLinks", () => {
  it("returns booking and search handoffs for a complete route", () => {
    const links = buildTravelSearchLinks("Kadapa", "Tirupati");
    expect(links.map((link) => link.id)).toEqual(["trains", "flights", "buses", "stays", "rentals", "local-transport", "food", "official-tourism", "ap-tourism", "places"]);
    expect(links[0].url).toBe("https://www.irctc.co.in/nget/train-search");
    expect(links.find((link) => link.id === "official-tourism").url).toBe("https://www.incredibleindia.gov.in/en");
    expect(links.find((link) => link.id === "ap-tourism").url).toBe("https://tourism.ap.gov.in/home");
    expect(links[1].url).toContain(encodeURIComponent("Kadapa"));
    expect(links[1].url).toContain(encodeURIComponent("Tirupati"));
  });

  it("does not return links for an incomplete route", () => {
    expect(buildTravelSearchLinks("Kadapa", "")).toEqual([]);
  });
});
