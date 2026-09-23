# TripMate AI Implementation Roadmap

## Current target
Build a maintainable MVP on the existing main branch.

## Architecture layers
- UI: React components and responsive CSS
- Domain: planner, validation, budget, family travel rules
- Data: demo/static snapshots with provenance
- Providers: maps, places, transport, rentals, hotels, food, weather
- Backend: Supabase authentication/database/edge functions
- AI: structured planner using validated data
- Quality: unit/E2E tests and data-freshness checks

## Non-negotiable data policy
- Never fabricate dynamic travel facts.
- Price/availability must be LIVE only when returned by a connected provider.
- Estimates must show their assumptions.
- Missing values remain UNAVAILABLE.
- Demo values are visibly marked DEMO.
- Critical temple facts should prefer primary government/temple sources.

## Delivery phases
1. Refactor the single-file prototype into feature/service modules.
2. Create planner input model and validation.
3. Create deterministic budget engine.
4. Add family and pilgrimage planner data structures.
5. Add provider adapters and source provenance.
6. Add Supabase schema/auth when credentials are configured.
7. Add maps/geocoding/routing provider.
8. Add transport and rental provider adapters.
9. Add AI planner using validated structured data.
10. Add saved trips and sharing.
11. Add comprehensive tests.
12. Add deployment configuration.

## Main branch rule
All repository changes in this project are intentionally made directly on main. No feature branches are required for the current workflow.
