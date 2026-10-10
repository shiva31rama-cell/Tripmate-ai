import { describe, expect, it } from "vitest";
import { getMobilityAdvice } from "./localGuideAdvice";

describe("getMobilityAdvice", () => {
  it("suggests checking walking first for very short distances", () => {
    expect(getMobilityAdvice(350).labelKey).toBe("walkFirst");
    expect(getMobilityAdvice(500).labelKey).toBe("walkFirst");
  });

  it("suggests comparing walking and transit for medium distances", () => {
    expect(getMobilityAdvice(501).labelKey).toBe("compareModes");
    expect(getMobilityAdvice(1200).labelKey).toBe("compareModes");
  });

  it("suggests checking transit for longer distances without claiming it exists", () => {
    expect(getMobilityAdvice(1201).labelKey).toBe("transitFirst");
  });

  it("rejects missing or invalid distances and keeps language within supported set", () => {
    expect(getMobilityAdvice(null)).toBeNull();
    expect(getMobilityAdvice(Number.NaN)).toBeNull();
    expect(getMobilityAdvice(-1)).toBeNull();
    expect(getMobilityAdvice(300, "ta").language).toBe("en");
  });
});
