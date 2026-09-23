import { describe, expect, it } from "vitest";
import {
  createProviderResult,
  demoResult,
  isUsableProviderResult,
  unavailableResult,
} from "./providerService";

describe("provider result boundary", () => {
  it("preserves provider provenance and metadata", () => {
    const result = createProviderResult({
      status: "LIVE",
      provider: "Example API",
      value: { price: 1200 },
      sourceUrl: "https://example.com",
      metadata: { query: "A-B" },
    });

    expect(result.provider).toBe("Example API");
    expect(result.value.price).toBe(1200);
    expect(result.metadata.query).toBe("A-B");
    expect(result.status).toBe("LIVE");
    expect(result.checkedAt).toBeTruthy();
  });

  it("marks missing provider data as unavailable", () => {
    const result = unavailableResult("Rail provider", "No current fare");
    expect(result.status).toBe("UNAVAILABLE");
    expect(result.message).toBe("No current fare");
    expect(isUsableProviderResult(result)).toBe(false);
  });

  it("supports explicit demo values", () => {
    const result = demoResult("TripMate Demo", { total: 5000 });
    expect(result.status).toBe("DEMO");
    expect(isUsableProviderResult(result)).toBe(true);
  });
});
