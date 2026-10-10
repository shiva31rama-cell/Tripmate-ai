import { afterEach, describe, expect, it, vi } from "vitest";
import { routeLocalWalk } from "./liveTravel";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("routeLocalWalk", () => {
  it("posts the supplied coordinates to the pedestrian-route API", async () => {
    const payload = {
      status: "LIVE",
      provider: "Valhalla pedestrian routing",
      distanceMeters: 740,
      durationMinutes: 10,
    };
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue(payload),
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await routeLocalWalk({
      origin: { latitude: 14.47, longitude: 78.82 },
      destination: { latitude: 14.472, longitude: 78.823 },
    });

    expect(result).toEqual(payload);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/local-guide/walking-route");
    expect(options.method).toBe("POST");
    expect(JSON.parse(options.body)).toEqual({
      originLatitude: 14.47,
      originLongitude: 78.82,
      destinationLatitude: 14.472,
      destinationLongitude: 78.823,
    });
  });

  it("rejects invalid coordinates before making a network request", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    await expect(routeLocalWalk({
      origin: { latitude: 91, longitude: 78.82 },
      destination: { latitude: 14.472, longitude: 78.823 },
    })).rejects.toThrow(/valid origin and destination/i);

    expect(fetchMock).not.toHaveBeenCalled();
  });
});
