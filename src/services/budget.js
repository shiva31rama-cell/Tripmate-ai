export function buildBudgetBreakdown({ travellers, days, categories }) {
  const people = Number(travellers);
  const tripDays = Number(days);
  const safeCategories = Array.isArray(categories) ? categories : [];

  const total = safeCategories.reduce(
    (sum, item) => sum + (Number.isFinite(item.amount) ? item.amount : 0),
    0
  );

  return {
    categories: safeCategories,
    total,
    perPerson: people > 0 ? total / people : null,
    perDay: tripDays > 0 ? total / tripDays : null,
    status:
      safeCategories.some((item) => item.status === "UNAVAILABLE")
        ? "PARTIAL"
        : "READY",
  };
}
