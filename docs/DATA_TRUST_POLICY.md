# TripMate AI Data Trust Policy

TripMate AI must distinguish facts, estimates, demo content, and unknown information.

## Statuses
- LIVE: returned from a current connected provider.
- VERIFIED_SNAPSHOT: retrieved from a reliable source and stored with a timestamp.
- ESTIMATED: calculated using an explicit assumption.
- USER_PROVIDED: entered by the traveller.
- UNAVAILABLE: no reliable value is available.
- DEMO: sample value used for product demonstration.

## Dynamic data
Treat fares, availability, room rates, offers, weather and current opening/booking slots as time-sensitive.

Display:
- status
- source/provider
- checked/fetched time
- source URL when available

Never display a dynamic value as exact when it is only an estimate.

## Images
Only use an image as a real place image when its source is known and permitted. Otherwise use a placeholder or explicit demo asset.

## Recommendations
AI may organize and personalize verified records. It must not invent place names, prices, availability, coordinates, opening hours or transport schedules.

## Booking
TripMate may link to a booking provider. It must not claim a booking was completed unless a real booking transaction was completed.
