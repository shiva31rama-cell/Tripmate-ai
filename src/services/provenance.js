export const STATUS_LABELS = Object.freeze({
  LIVE: "Live data",
  VERIFIED_SNAPSHOT: "Verified snapshot",
  ESTIMATED: "Estimated",
  UNAVAILABLE: "Unavailable",
  DEMO: "Demo data",
  USER_PROVIDED: "User provided",
});

export function withProvenance(value, metadata = {}) {
  return {
    value,
    provider: metadata.provider ?? null,
    sourceUrl: metadata.sourceUrl ?? null,
    status: metadata.status ?? "UNAVAILABLE",
    checkedAt: metadata.checkedAt ?? new Date().toISOString(),
  };
}
