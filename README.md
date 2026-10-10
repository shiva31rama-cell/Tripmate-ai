# TripMate AI

TripMate AI is a responsive travel-planning application for families, students and independent travellers. The product combines itinerary planning, destination discovery, pilgrimage information, transport discovery, local vehicle rentals and transparent budget planning.

## Current prototype

The repository now contains a clean, responsive React + Vite foundation with:

- Home dashboard and AI trip-planner form
- Source → destination validation, including same-location rejection
- Guest mode with **Skip for now / Continue as guest**
- Real Supabase email/password sign-up and login, Google OAuth entry point, and password reset/recovery flow when configured
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

## First-time visitor Local Guide

The Local Guide is designed for solo travellers and two-person trips in unfamiliar Indian towns and cities. It supports Telugu, Hindi and English, and includes:

- One-tap, user-initiated nearby search using browser location permission
- Nearby mapped food, essentials, public transport stops, worship places and attractions
- Distance-based walk-first advice, explicitly labelled as an estimate rather than a pedestrian route guarantee
- Google Maps links for walking directions and public-transport exploration
- A practical phrasebook for asking about walking distance, bus stops, fares and entrances in Telugu, Hindi and English
- Optional local-guide questions grounded in the nearby map results when available

The guide never claims a live bus timetable, verified fare, safe/accessible footpath or venue opening status unless a connected source can verify it. Straight-line distance remains an estimate. Requested pedestrian route distance and duration are returned by Valhalla, but do not guarantee a sidewalk, safe crossing, unrestricted access or current road conditions. Location is requested only after the user taps nearby search and is not added to saved trip records by this feature.

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

## Engineering roadmap (updated)

Now implemented in `main`: Supabase email/password and Google OAuth flows (when configured), owner-scoped cloud trip persistence, guest-trip import, live OSM place discovery, live route/weather context, provider handoff links, cache/input safeguards and CI coverage.

Remaining integration work depends on outside providers or production setup:

1. Configure the owner's Supabase project, redirect allow-list and Google OAuth credentials.
2. Connect authorized train, bus, flight, stay and vehicle providers for prices, inventory and booking actions.
3. Add official temple/government source ingestion and independent source verification for opening hours, darshan rules and schedules.
4. Add alerts, data-freshness monitoring and deployment observability.
5. Run end-to-end testing against actual configured provider accounts and deployment domains.


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

1. Configure and verify Supabase Auth, SQL migrations and Google OAuth for the actual deployment URL.
2. Add authorized commercial transport, accommodation and rental data providers.
3. Build official-source temple/pilgrimage ingestion with checked timestamps and explicit unavailable states.
4. Test real sign-in, cloud save/import/delete flows against the deployed Supabase project.
5. Deploy and add monitoring for provider failures, rate limits and data freshness.


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

    docker compose -f docker-compose.ai.yml up --build -d
    docker compose -f docker-compose.ai.yml logs -f tripmate-ai-service

Compose waits for Ollama, automatically pulls the configured model into the persistent `ollama_data` volume, then starts the API. The first startup downloads several GB and may take a while; subsequent starts reuse the model. Open http://localhost:8080. The Ollama and API ports are not published to the host; the browser reaches the API through Nginx.

### What is genuinely live vs not yet live

Live with the open stack: location verification, road route distance/duration, nearby OSM places and current weather, plus local AI generation when Ollama is running.

Not fabricated: train/flight/bus/hotel/rental booking fares, seat/room/vehicle availability, cancellation terms and booking confirmation. Those require authorized provider integrations. TripMate returns UNAVAILABLE instead of pretending open data contains commercial inventory.


## Current implementation status (truthful boundary)

**Available now**
- Live, user-triggered location lookup through Nominatim, OSRM driving routes, Overpass nearby mapped places, and Open-Meteo current weather, with cache and provider warnings.
- Local Ollama itinerary suggestions when the configured model is downloaded and running.
- Guest trip saving in the current browser only.
- OpenStreetMap map links and visible provider source links for generated live trip context.
- A database foundation and owner-scoped RLS policies in migrations `001` and `002`.

**Not connected / not a live booking feature**
- Email/password authentication and Google OAuth: wired to Supabase Auth when `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are configured; Google also needs provider credentials set in Supabase.
- Cross-device account sync and persistence: trips, itinerary JSON and source context are saved to Supabase when signed in. Guest trips stay local until imported. Run migrations `001`–`003` first.
- Train, bus, flight, taxi, ferry, accommodation, restaurant and rental inventory, fares, seat/room/vehicle availability, offers, cancellations or booking confirmations. These require authorized provider integrations.
- Official temple schedules, darshan slots and cultural/heritage content ingestion. Demo Explore cards remain explicitly demo data.
- The current route is an **OSRM driving route**, not a comparison across all transport modes.
- An estimate for real-world trip cost is intentionally not shown on a live plan until a source-backed fare/stay provider is connected.

### Database setup
Apply Supabase migrations in order: `supabase/migrations/001_tripmate_foundation.sql`, then `supabase/migrations/002_tripmate_rls_policies.sql`. The second migration adds owner-only read/write policies for profiles, trips, nested trip records, saved places and budget items. Applying the SQL does not itself connect Supabase Auth or persistence to the frontend.

### Public provider limits
The public Nominatim endpoint is rate-limited. The backend serializes uncached geocoding requests within its single API worker and caches results. If you scale the API to multiple workers/replicas, use a shared rate limiter and cache or configure a hosted Nominatim-compatible provider before increasing traffic. Do not add autocomplete or bulk geocoding against the public endpoint.


## Connected account sync and live place discovery

The frontend now has real Supabase Auth flows and account-scoped trip persistence when project settings are supplied. Without those settings, the app stays in guest mode; it never pretends a local form submission created an account.

### Enable authentication and trip sync

1. Create a Supabase project and copy its **Project URL** and **publishable/anon key**.
2. Copy `.env.example` to `.env` and fill these frontend values:

   ```dotenv
   VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
   VITE_SUPABASE_ANON_KEY=YOUR_PUBLISHABLE_OR_ANON_KEY
   VITE_API_BASE_URL=http://localhost:8000
   ```

   Never put the Supabase `service_role` key in a `VITE_*` variable or browser code.
3. In the Supabase SQL Editor, run migrations in order:
   `001_tripmate_foundation.sql`, `002_tripmate_rls_policies.sql`, then `003_auth_and_trip_sync.sql`.
4. In Supabase **Authentication → URL Configuration**, set your local app as the Site URL (usually `http://localhost:5173`) and add your deployed/Codespaces app URL to the redirect allow-list.
5. Email/password sign-up and login, password reset email requests, password recovery, and Google OAuth are wired through Supabase Auth. To use Google, enable the Google provider in Supabase **Authentication → Providers** and configure its OAuth credentials/redirects there. For password reset, ensure your local/deployed origin is in Supabase **Authentication → URL Configuration → Redirect URLs** and that the email template links back to the app.
6. Restart the Vite server after changing `.env`. Sign in and create a trip; the app saves trip fields, itinerary JSON and provider context to the authenticated user's row. RLS restricts rows to their owner.

If migrations have not been applied, auth can still work but trip sync will show a clear database error. Guest trips stay in local browser storage and are not uploaded until cloud persistence is explicitly used by a signed-in session.

### Optional Google Places fallback

The open-data path remains the default. If Overpass returns no mapped places or is temporarily unavailable, the backend can optionally query Google Places API (New) when a server-side key is configured. Google Places requires a Google Cloud project, the Places API enabled, billing/provider terms accepted, and an API key restricted to the backend's use. The key must never be exposed through a `VITE_*` variable.

Set `GOOGLE_PLACES_API_KEY` in your private local `.env` file or deployment environment, then restart the backend/container. Docker Compose passes this variable only to the FastAPI service. Without the key, TripMate continues using OpenStreetMap and does not fail solely because Google is unconfigured. Google Places results are labelled with their provider and source URL; they do not provide a booking confirmation or guarantee current venue hours.

Official setup and API reference: https://developers.google.com/maps/documentation/places/web-service

### Live place search and booking handoffs

- Explore now provides a button-triggered OpenStreetMap search. It verifies a location and requests nearby mapped attractions and places of worship. It is deliberately not autocomplete, to respect public Nominatim's usage policy.
- Plans provide external handoffs to IRCTC's official train portal, Google Flights/Hotels search, redBus and Google Maps local rental search. These handoffs are **not** integrated fare/availability feeds, and TripMate does not claim prices, inventory, opening hours or a booking were verified.
- The map provider may omit places or stale tags. Check opening times, darshan/entry rules, local transport and official venue information before departure.
- Commercial fares, seat inventory, accommodation inventory, local rental availability, cancellations and booking still require authorized provider APIs/accounts; those remain unavailable inside TripMate until such a provider is configured.

### Current verified boundary

The frontend and backend support live geocoding, OSRM driving distance/duration, mapped nearby places and current weather when the public sources are reachable. Local model itinerary generation requires Ollama and the configured model. Saved trip synchronization requires a configured Supabase project and all three migrations. The GitHub Actions workflow tests the application and backend, but does not provision third-party accounts or validate live provider uptime.


### Walking-first local guide (English, Telugu, Hindi)

The Local Guide view is designed for first-time visitors who arrive somewhere unfamiliar and do not want to pay for a ride before checking nearby options.

- The visitor explicitly taps Find places near me before the browser requests device location. The coordinates are used for that search and are not added to saved trip records.
- A user-selectable 500 m, 1 km, 2 km or 5 km radius searches OpenStreetMap for mapped food places, essential services, worship/cultural sites, attractions and public-transport stops.
- Results are initially sorted by approximate straight-line distance. A separately labelled estimate uses a simple 25% route-detour assumption and 4 km/h walking speed only until a route is requested.
- Each coordinate-backed place has a **Calculate walking route** action. It requests a pedestrian-costed route from the configurable Valhalla routing API, then shows the returned route distance and approximate duration only when the provider returns valid route data. If routing is unavailable, the UI explains that and keeps the Google Maps walking-directions handoff as an alternative.
- Every place also offers a Google Maps handoff for walking directions and a public-transport directions search. These links are not proof that a route, bus, fare or departure time is available; users must check the returned route and local conditions.
- The in-guide interface, recommendations and safety notes support English, Telugu and Hindi. Place names remain as returned by the map provider.
- The Local Guide question box sends a short question, selected language, group size (solo or two people), and nearby result list to the configured local Ollama model. Its prompt forbids invented fares, timetables, venue status and unsafe shortcuts. If Ollama is unavailable, the nearby map search remains usable.
- If the map provider fails or has no mapped result, the UI says so instead of inventing a nearby shop or transport service. OpenStreetMap results can be incomplete and should not replace local safety judgement.

The API endpoint is POST /api/local-guide with latitude, longitude and radiusMeters. It validates coordinate bounds, caps search radius and result count, caches map results briefly in process memory, and returns source/provider metadata. Browser location requires user permission and a secure browser context (localhost or HTTPS).

Map and directions references:
- OpenStreetMap: https://www.openstreetmap.org/
- Overpass API: https://overpass-api.de/
- Google Maps URLs and walking/transit handoffs: https://developers.google.com/maps/documentation/urls/get-started



### First-visit quick prompts (English, Telugu, Hindi)

The Local Guide now includes one-tap question starters in all three supported languages for finding public-transport stops, nearby food, walk-versus-ride decisions, and essential services such as pharmacies or ATMs. Selecting a prompt fills the question box; the traveller can review or edit it before asking the AI guide. Ride advice also reminds visitors to ask the total fare or confirm the meter before starting. This is practical guidance, not a claim about local fare rules or a guarantee that a service is available.

### Walking-first mobility suggestions

The Local Guide now adds a multilingual mobility hint to each nearby result:
- Up to 500 m straight-line distance: **check walking first**.
- 501–1,200 m: **compare walking and public transport**.
- Beyond 1,200 m: **compare public transport**.
- These are decision prompts, not claims that a pedestrian path, sidewalk, bus, fare or service is available. The UI explicitly asks travellers to inspect the real route and local conditions; it never invents a fare or tells people to take an unsafe shortcut.
- Labels follow the selected English, Telugu or Hindi guide language.



## Phase tracker and remaining launch work (updated 2026-10-10)

This tracker separates repository work that can be verified by CI from work that needs real provider accounts, local government data agreements or deployment credentials. “Implemented” does not mean third-party credentials or production uptime have been provisioned.

| Phase | Status | Scope and exit condition |
|---|---|---|
| 1. Core app and data-trust rules | **Implemented / CI-tested** | Responsive app, guest trips, clear demo/live/unavailable status, input validation and source metadata. |
| 2. Open-data travel foundation | **Implemented / CI-tested** | FastAPI service, OSM discovery/geocoding, OSRM driving route, Open-Meteo weather, local Ollama generation, provider caching and Docker stack. Public provider rate limits still apply. |
| 3. First-visit Local Guide | **Implemented / CI-tested** | English, Telugu and Hindi UI, user-triggered location, nearby POI categories, mobility hints, phrasebook, quick prompts, and on-demand Valhalla pedestrian route distance/time with Google Maps fallbacks. Live transit departures/fare comparison are not yet integrated. |
| 4. Accounts and cloud sync | **Code implemented; owner setup pending** | Apply Supabase migrations 001–003, configure Auth redirect URLs and optional Google OAuth, then test sign-up/recovery/save/import/delete against the actual project. |
| 5. Commercial transport/stays/rentals | **Provider integration pending** | Requires authorized APIs/agreements for fares, live schedules, seat/room/vehicle inventory, taxes, refund terms and booking confirmation. Until then, use outbound search links and show prices as unavailable. |
| 6. Official pilgrimage and local knowledge | **Ingestion/review pending** | Select official tourism/temple sources, map each claim to source URL and checked time, and add review/update processes for schedules, entry rules and public facilities. Demo cards must stay labelled DEMO. |
| 7. Operations and production hardening | **Partially implemented; deployment work pending** | Baseline browser security headers are configured in Nginx; geocoding and pedestrian route requests are throttled per API process. Still configure a supported/self-hosted routing service at scale, shared rate limiting/cache when horizontally scaled, provider-failure alerts, structured logs, retention policy, and production CORS/TLS at the deployment edge. |
| 8. End-to-end launch validation | **Pending real-environment run** | Verify browser location permissions, Telugu/Hindi/English flows, auth and cloud persistence, provider outages, mobile layouts, deployment health and data freshness on the deployed app. |

### Pedestrian routing configuration

VALHALLA_URL controls the pedestrian-routing API. The default is the public Valhalla instance documented by its OpenAPI definition (https://valhalla1.openstreetmap.de). The Local Guide makes route requests only when a traveller presses **Calculate walking route** and caches successful results for the backend cache TTL. Uncached Valhalla requests are also serialized and throttled per API process by VALHALLA_MIN_INTERVAL_SECONDS (default 1.1 seconds). Public routing services may throttle or become unavailable; configure an operated/self-hosted Valhalla instance or suitable hosted provider before a wider launch. The current result shows route distance/time and source, but is not a live safety assessment and does not guarantee pedestrian access, sidewalk condition or closures.

Official routing references:
- Valhalla route API: https://github.com/valhalla/valhalla/blob/master/docs/docs/api/route/api-reference.md
- Valhalla API schema and documented server: https://github.com/valhalla/valhalla/blob/master/docs/docs/api/openapi.yaml
- OpenTripPlanner for a later transit phase: https://docs.opentripplanner.org/en/latest/apis/ (requires locally managed transit feeds/data or a suitable provider; no live Indian fare/feed is assumed by TripMate).

### Next concrete milestones

1. Apply Supabase migrations and test auth/cloud sync in the owner's project.
2. Deploy/operate a reliable pedestrian-routing provider for the expected traffic and validate routes in several Indian towns.
3. Select city/agency GTFS or an authorized transit provider, then implement public-transport route/time comparisons without guessing fares.
4. Add versioned official-source ingestion for temple, tourism and civic essentials, with freshness checks and an editorial review process.
5. Connect authorized commercial travel APIs only when terms and credentials are available; exercise booking flows in provider sandboxes before production.
6. Run the full end-to-end launch checklist and add monitoring/alerts before calling the project production-ready.


### Browser security headers

The Nginx frontend sends X-Content-Type-Options, X-Frame-Options, Referrer-Policy and a Permissions-Policy limiting geolocation to the app origin and disabling camera/microphone access. The app intentionally asks for browser location only after the traveller initiates Nearby Search. HTTPS/TLS and any HSTS policy must be configured at the production reverse proxy/load balancer that terminates TLS; this development container serves HTTP internally.
