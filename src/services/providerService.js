/**
 * Provider boundary for future live integrations.
 * UI components should never call an external provider directly.
 */

export function createProviderResult({ status, provider, value = null, sourceUrl = null }) {
  return {
    status,
    provider,
    value,
    sourceUrl,
    checkedAt: new Date().toISOString(),
  };
}

export function unavailableResult(provider, message) {
  return createProviderResult({
    status: "UNAVAILABLE",
    provider,
    value: null,
    sourceUrl: null,
    message,
  });
}
