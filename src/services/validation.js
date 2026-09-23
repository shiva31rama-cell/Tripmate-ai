export function validateTripInput({ from, to, travellers, days }) {
  const source = String(from ?? "").trim();
  const destination = String(to ?? "").trim();
  const travellerCount = Number(travellers);
  const tripDays = Number(days);

  if (!source || !destination) {
    return {
      valid: false,
      code: "MISSING_ROUTE",
      message: "Please enter both a source and a destination.",
    };
  }

  if (source.localeCompare(destination, undefined, { sensitivity: "accent" }) === 0) {
    return {
      valid: false,
      code: "SAME_LOCATION",
      message:
        "Source and destination are the same. Choose another destination or explore this city locally.",
    };
  }

  if (!Number.isInteger(travellerCount) || travellerCount < 1 || travellerCount > 30) {
    return {
      valid: false,
      code: "INVALID_TRAVELLERS",
      message: "Travellers must be a whole number between 1 and 30.",
    };
  }

  if (!Number.isInteger(tripDays) || tripDays < 1 || tripDays > 60) {
    return {
      valid: false,
      code: "INVALID_DAYS",
      message: "Trip length must be a whole number between 1 and 60 days.",
    };
  }

  return { valid: true };
}

export function calculateDemoBudget({ travellers, days }) {
  const travellerCount = Number(travellers);
  const tripDays = Number(days);

  const items = [
    { category: "Intercity transport", amount: travellerCount * 900, status: "DEMO" },
    { category: "Stay", amount: tripDays * 1800, status: "DEMO" },
    { category: "Food", amount: travellerCount * tripDays * 450, status: "DEMO" },
    { category: "Local transport", amount: tripDays * 650, status: "DEMO" },
  ];

  const total = items.reduce((sum, item) => sum + item.amount, 0);
  const perPerson = total / travellerCount;
  const perDay = total / tripDays;

  return { items, total, perPerson, perDay, status: "DEMO" };
}
