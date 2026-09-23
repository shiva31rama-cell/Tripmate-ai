import { buildBudgetBreakdown } from "./budget";
import { demoRentals } from "../data/demoData";
import { calculateDemoBudget, validateTripInput } from "./validation";

export function createDemoTrip(input) {
  const validation = validateTripInput(input);

  if (!validation.valid) {
    return {
      ok: false,
      validation,
    };
  }

  const source = String(input.from).trim();
  const destination = String(input.to).trim();
  const travellers = Number(input.travellers);
  const days = Number(input.days);
  const demoBudget = calculateDemoBudget({ travellers, days });
  const budget = buildBudgetBreakdown({
    travellers,
    days,
    categories: demoBudget.items,
  });

  return {
    ok: true,
    trip: {
      source,
      destination,
      travellers,
      days,
      dataStatus: "DEMO",
      budget,
      rentalPreview: demoRentals.map((rental) => ({
        id: rental.id,
        vehicleType: rental.vehicleType,
        dailyPrice: rental.dailyPrice,
        status: rental.status,
      })),
      note:
        "This prototype plan uses demo values. Connect verified providers before treating travel prices, schedules or availability as current.",
    },
  };
}
