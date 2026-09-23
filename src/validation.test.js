import { describe, expect, it } from "vitest";
import { calculateDemoBudget, validateTripInput } from "./services/validation";

describe("validateTripInput", () => {
  it("rejects missing source or destination", () => {
    const result = validateTripInput({ from: "", to: "Hyderabad", travellers: 2, days: 3 });
    expect(result.valid).toBe(false);
    expect(result.code).toBe("MISSING_ROUTE");
  });

  it("rejects the same source and destination", () => {
    const result = validateTripInput({ from: "Chennai", to: "Chennai", travellers: 2, days: 3 });
    expect(result.valid).toBe(false);
    expect(result.code).toBe("SAME_LOCATION");
  });

  it("accepts a valid trip", () => {
    const result = validateTripInput({ from: "Bhimavaram", to: "Madurai", travellers: 4, days: 5 });
    expect(result.valid).toBe(true);
  });
});

describe("calculateDemoBudget", () => {
  it("calculates total, per-person and per-day values deterministically", () => {
    const budget = calculateDemoBudget({ travellers: 2, days: 3 });
    expect(budget.total).toBe(11000);
    expect(budget.perPerson).toBe(5500);
    expect(budget.perDay).toBeCloseTo(3666.6666667);
    expect(budget.status).toBe("DEMO");
  });
});
