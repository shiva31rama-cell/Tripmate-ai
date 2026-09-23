import { validateTripInput } from "./validation";

export function createDemoTrip(input) {
  const validation = validateTripInput(input);

  if (!validation.valid) {
    return {
      ok: false,
      validation,
    };
  }

  const source = input.from.trim();
  const destination = input.to.trim();

  return {
    ok: true,
    trip: {
      source,
      destination,
      travellers: Number(input.travellers),
      days: Number(input.days),
      dataStatus: "DEMO",
      note:
        "This prototype plan uses demo values. Connect verified providers before treating travel prices, schedules or availability as current.",
    },
  };
}
