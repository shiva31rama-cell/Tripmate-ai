# TripMate AI

TripMate AI is a responsive travel-planning application for families, students and independent travellers. The product combines itinerary planning, destination discovery, pilgrimage information, transport discovery, local vehicle rentals and transparent budget planning.

## Current prototype

The repository now contains a clean, responsive React + Vite foundation with:

- Home dashboard and AI trip-planner form
- Source → destination validation, including same-location rejection
- Guest mode with **Skip for now / Continue as guest**
- Login / Sign-up UI with Google sign-in entry point
- Responsive mobile bottom navigation
- Explore destination and temple cards
- Local bike/scooter/car rental discovery UI
- Rental duration, daily price and deposit display
- Family traveller/day inputs
- Itinerary timeline preview
- Transparent estimated-budget breakdown
- Explicit LIVE / VERIFIED / ESTIMATED concepts in the UI
- Professional, non-neon visual design
- Mobile, tablet and desktop layouts

## Product principles

1. **Do not invent travel facts.** AI organizes trusted information; it does not become the source of truth.
2. Dynamic prices, schedules and availability must be marked as live only when a connected provider supplies current data.
3. Unknown information is shown as unavailable rather than guessed.
4. Group totals and per-person values are calculated separately.
5. Refundable security deposits are not silently counted as travel expenses.
6. Provider offers must carry validity/terms when available.
7. Source URLs and verification timestamps belong in the data model.
8. Freight vehicles such as lorries remain separate from passenger travel.

## Planned modules

- Authentication: email/password, Google OAuth and guest access
- AI itinerary engine
- Trains, buses, flights, taxis/autos and ferries/ships
- Bike, scooter and car rentals
- Hotels and accommodation
- Food and restaurants
- Attractions and activities
- Temple / pilgrimage knowledge
- Family travel preferences
- Maps, routes, distances and visual destination pages
- Provider comparison and official booking links
- Offers with expiry and eligibility
- Budget engine
- Data provenance and freshness checks
- Saved trips and traveller profiles
- Alerts and reminders
- Multilingual UI
- Multi-currency support

## Data architecture

The intended data layer separates:

- **Static knowledge:** stable destination, geography and source-backed cultural information.
- **Verified snapshots:** data retrieved from official/provider sources and stored with timestamps.
- **Live data:** current price, schedule, availability, weather and other rapidly changing values returned by connected services.
- **Estimated data:** clearly labelled calculations based on explicit assumptions.
- **Unavailable data:** no reliable value is substituted.

Open/licensed data such as OpenStreetMap and Wikidata can support the foundation, while official government/temple/provider sources should be preferred for critical facts.

## Development

Requirements:

- Node.js 18+
- npm

Install and run:

```bash
npm install
npm run dev
```

Production build:

```bash
npm run build
```

## Repository rule

Development is intentionally being performed directly on the **`main` branch**, as requested for this project. No feature/development branch is created by the current implementation workflow.

## Code quality

The code is kept intentionally straightforward:

- meaningful component and variable names
- consistent two-space indentation
- small React components
- semantic HTML where practical
- responsive CSS grouped by component purpose
- no secrets committed to the repository
- dynamic integrations should be introduced behind clear service/data boundaries

## Next engineering stage

The visual prototype is the first working foundation. The next implementation stage is to replace demonstration values with validated service adapters and persistence:

1. Authentication provider + secure session handling
2. Database schema for users, trips, destinations, providers, rentals and source provenance
3. Geocoding/map provider abstraction
4. Transport provider adapters
5. Rental-provider/local-business adapter
6. Temple/government source ingestion pipeline
7. Budget calculation service
8. AI planner that consumes validated structured data
9. Automated data freshness/validation tests
10. Deployment and production environment configuration


## Implemented next-stage foundation

The current main branch now also includes:

- Guest trip persistence with browser-local storage
- Open / remove saved guest trips
- Explore search and category filters
- Rental vehicle filters
- Explicit demo status badges across prototype data
- Provider-result helpers with LIVE, DEMO, and UNAVAILABLE boundaries
- Provider-result unit tests
- Expanded Supabase RLS policies and indexes for user-owned trip data

### Integration rule

The UI is intentionally usable without API keys. Live booking, live fares, real availability, geocoding and AI generation are not fabricated. They should be added behind provider services once credentials and production services are configured.


## Current development checkpoint

Implemented directly on `main`:

- Guest trip persistence service and tests
- Local saved-trip open/remove flow
- Explore search and destination-type filters
- Rental vehicle filters
- Data-status badges for prototype values
- Provider result helpers with explicit messages/metadata
- Provider boundary tests
- Trip planner now reuses the budget service
- Supabase RLS policies for user-owned trips, preferences, days, items, budget items and saved places
- Public read policy for the source catalog
- Supporting database indexes

Live provider credentials are still intentionally not required for the prototype. Until connected, prices, availability, schedules, geocoding and authentication remain clearly labelled as demo/prototype behaviour rather than fabricated live data.


## Next execution order

1. Supabase Auth session and Google OAuth integration.
2. Geocoding and route adapters with explicit unavailable states.
3. Transport search adapters for trains, buses, flights and ferries.
4. Rental, hotel, food and temple provider adapters with source/checked-at metadata.
5. AI itinerary generation from validated structured provider data.
6. Production tests and deployment configuration.


## Real-time open-source implementation

The main branch now includes a working open-data travel pipeline:

- OpenStreetMap Nominatim for deliberate, cached geocoding
- OSRM for live road distance and duration
- Overpass API for nearby tourism and places-of-worship discovery
- Open-Meteo for current weather context
- Ollama plus a local open-weight model for evidence-first itinerary generation
- FastAPI service boundary so the React client does not call public providers directly
- Process-local caching to reduce repeated public API traffic
- Provider, status, source URL and checked-at metadata in returned live facts
- Graceful UNAVAILABLE state for booking fares instead of fabricated prices
- Docker stack for React/Nginx + FastAPI + Ollama
- Nginx API proxy for same-origin production requests

OpenStreetMap's public Nominatim service has strict capacity rules, including a maximum of one request per second and a requirement for an identifying User-Agent; TripMate therefore uses deliberate user-triggered searches, server-side caching and a switchable service URL rather than autocomplete or bulk geocoding. Overpass is a read-only OSM data-consumer API suited to targeted POI queries.

### Run the real-time stack locally

Pull the local AI model once:

    ollama pull qwen2.5:7b

Start the frontend:

    npm install
    npm run dev

Start the open-data + AI service in another terminal:

    cd ai
    python -m pip install -r requirements.txt
    uvicorn server:app --host 0.0.0.0 --port 8000

The Vite dev server proxies /api and /health to FastAPI.

For the full containerized stack:

    docker compose -f docker-compose.ai.yml up --build

Open http://localhost:8080 after startup. Pull the configured Ollama model once before the first AI itinerary request.

### What is genuinely live vs not yet live

Live with the open stack: location verification, road route distance/duration, nearby OSM places and current weather, plus local AI generation when Ollama is running.

Not fabricated: train/flight/bus/hotel/rental booking fares, seat/room/vehicle availability, cancellation terms and booking confirmation. Those require authorized provider integrations. TripMate returns UNAVAILABLE instead of pretending open data contains commercial inventory.
