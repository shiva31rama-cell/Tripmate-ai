# TripMate AI local model layer

This directory defines the open-source/local AI boundary for TripMate.

## Architecture

React/Vite must not call Ollama directly from browser code. The production shape is:

`React UI -> TripMate AI service -> Ollama -> local open-weight model`

The service receives structured trip context and asks the model to return a JSON itinerary. It must never invent live prices, availability, schedules, distances, booking status, or source provenance. Those facts come from provider/data services and are passed into the AI context.

## Local model

The default development model is configurable with `OLLAMA_MODEL` and is intentionally not downloaded into the repository or Docker image. Install Ollama separately and pull a model that your computer can run.

Example:

```powershell
ollama pull qwen2.5:7b
```

You can replace this with another locally supported open-weight model.

## Important data rule

Each factual item supplied to the model should carry a status such as `LIVE`, `VERIFIED_SNAPSHOT`, `ESTIMATED`, `DEMO`, or `UNAVAILABLE`. The model must preserve that status and should say when data is unavailable rather than filling the gap with a guess.
