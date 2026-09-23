/**
 * Provider boundary for future live integrations.
 * UI components should never call an external provider directly.
 */

export function createProviderResult({
  status,
  provider,
  value = null,
  sourceUrl = null,
  message = null,
  metadata = {},
}) {
  return {
    status,
    provider,
    value,
    sourceUrl,
    checkedAt: new Date().toISOString(),
    message,
    metadata,
  };
}

export function unavailableResult(provider, message) {
  return createProviderResult({
    status: "UNAVAILABLE",
    provider,
    message,
  });
}

export function demoResult(provider, value, sourceUrl = null, message = null) {
  return createProviderResult({
    status: "DEMO",
    provider,
    value,
    sourceUrl,
    message,
  });
}

export function isUsableProviderResult(result) {
  return Boolean(result && result.status !== "UNAVAILABLE" && result.value != null);
}
