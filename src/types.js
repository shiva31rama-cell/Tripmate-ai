/** @typedef {"LIVE"|"VERIFIED_SNAPSHOT"|"ESTIMATED"|"UNAVAILABLE"|"DEMO"} DataStatus */

export const DATA_STATUS = Object.freeze({
  LIVE: "LIVE",
  VERIFIED_SNAPSHOT: "VERIFIED_SNAPSHOT",
  ESTIMATED: "ESTIMATED",
  UNAVAILABLE: "UNAVAILABLE",
  DEMO: "DEMO",
});

export const TRAVEL_MODES = Object.freeze([
  { id: "train", label: "Train" },
  { id: "bus", label: "Bus" },
  { id: "flight", label: "Flight" },
  { id: "car", label: "Car" },
  { id: "bike", label: "Bike" },
  { id: "ferry", label: "Ferry / Ship" },
  { id: "taxi", label: "Taxi / Auto" },
  { id: "public_transport", label: "Public transport" },
]);
