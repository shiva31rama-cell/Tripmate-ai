import { describe, expect, it } from "vitest";
import { buildBudgetBreakdown } from "./budget";

describe("buildBudgetBreakdown", () => {
  it("returns total, per-person and per-day values", () => {
    const result = buildBudgetBreakdown({
      travellers: 4,
      days: 2,
      categories: [
        { category: "transport", amount: 4000, status: "DEMO" },
        { category: "stay", amount: 3000, status: "DEMO" },
        { category: "food", amount: 2000, status: "DEMO" },
      ],
    });

    expect(result.total).toBe(9000);
    expect(result.perPerson).toBe(2250);
    expect(result.perDay).toBe(4500);
    expect(result.status).toBe("READY");
  });
});
