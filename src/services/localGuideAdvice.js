const THRESHOLDS = { walkFirstMaxMeters: 500, compareMaxMeters: 1200 };

export function getMobilityAdvice(distanceMeters, language = "en") {
  if (distanceMeters === null || distanceMeters === undefined || distanceMeters === "") return null;
  const distance = Number(distanceMeters);
  if (!Number.isFinite(distance) || distance < 0) return null;

  const labelKey = distance <= THRESHOLDS.walkFirstMaxMeters
    ? "walkFirst"
    : distance <= THRESHOLDS.compareMaxMeters
      ? "compareModes"
      : "transitFirst";

  return {
    kind: labelKey,
    labelKey,
    distanceMeters: distance,
    language: ["en", "te", "hi"].includes(language) ? language : "en",
    status: "ESTIMATED",
    note: "Uses straight-line distance only; never guarantees walkability or a transit service.",
  };
}
