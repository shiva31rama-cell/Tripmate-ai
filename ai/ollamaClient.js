const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || "http://localhost:11434";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "qwen2.5:7b";

export async function generateTripPlan(tripContext, options = {}) {
  const response = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    signal: options.signal,
    body: JSON.stringify({
      model: OLLAMA_MODEL,
      stream: false,
      format: "json",
      messages: [
        {
          role: "system",
          content:
            "You are TripMate AI. Build travel itineraries only from the supplied structured facts. Never invent prices, schedules, availability, distances, booking links, opening hours, or source claims. Preserve each fact's status. If required data is missing or unavailable, say so in the response. Return valid JSON with summary, days, budgetNotes, and dataWarnings.",
        },
        {
          role: "user",
          content: JSON.stringify(tripContext),
        },
      ],
      options: {
        temperature: 0.2,
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`Ollama request failed: ${response.status}`);
  }

  const data = await response.json();
  return JSON.parse(data.message?.content || "{}");
}

export { OLLAMA_BASE_URL, OLLAMA_MODEL };
