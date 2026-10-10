import unittest
from unittest.mock import AsyncMock

import server
from pydantic import ValidationError

from server import PlaceSearchRequest, TripRequest, _cache, cached, ground_ai_plan, put_cache, safe_http_url


class GooglePlacesFallbackTests(unittest.IsolatedAsyncioTestCase):
    async def test_maps_google_place_fields_and_keeps_api_key_server_side(self):
        class FakeResponse:
            def raise_for_status(self):
                return None

            def json(self):
                return {
                    "places": [{
                        "id": "place-id-1",
                        "displayName": {"text": "Kadapa Fort"},
                        "location": {"latitude": 14.47, "longitude": 78.82},
                        "primaryType": "historical_landmark",
                        "websiteUri": "https://example.org/fort",
                        "nationalPhoneNumber": "+91 12345 67890",
                        "googleMapsUri": "https://maps.google.com/?cid=123",
                        "regularOpeningHours": {"weekdayDescriptions": ["Hours vary"]},
                    }]
                }

        client = type("FakeClient", (), {})()
        client.post = AsyncMock(return_value=FakeResponse())
        previous_key = server.GOOGLE_PLACES_API_KEY
        server.GOOGLE_PLACES_API_KEY = "test-server-key"
        try:
            places = await server.google_places_search(
                client,
                {"latitude": 14.47, "longitude": 78.82},
                "tourist places near Kadapa",
            )
        finally:
            server.GOOGLE_PLACES_API_KEY = previous_key

        self.assertEqual(places[0]["name"], "Kadapa Fort")
        self.assertEqual(places[0]["provider"], "Google Places API")
        self.assertEqual(places[0]["status"], "LIVE")
        self.assertEqual(places[0]["website"], "https://example.org/fort")
        self.assertEqual(places[0]["openingHours"], "Hours vary")
        kwargs = client.post.await_args.kwargs
        self.assertEqual(kwargs["headers"]["X-Goog-Api-Key"], "test-server-key")
        self.assertIn("places.displayName", kwargs["headers"]["X-Goog-FieldMask"])

    async def test_google_places_fallback_requires_backend_key(self):
        previous_key = server.GOOGLE_PLACES_API_KEY
        server.GOOGLE_PLACES_API_KEY = ""
        try:
            with self.assertRaises(server.HTTPException):
                await server.google_places_search(
                    object(), {"latitude": 14.47, "longitude": 78.82}, "places near Kadapa"
                )
        finally:
            server.GOOGLE_PLACES_API_KEY = previous_key


class TripRequestTests(unittest.TestCase):
    def test_accepts_valid_alias_and_bounds(self):
        request = TripRequest(**{"from": "Kadapa", "to": "Tirupati", "travellers": 2, "days": 3})
        self.assertEqual(request.from_, "Kadapa")
        self.assertEqual(request.to, "Tirupati")

    def test_rejects_traveller_count_above_limit(self):
        with self.assertRaises(ValidationError):
            TripRequest(**{"from": "Kadapa", "to": "Tirupati", "travellers": 31, "days": 3})

    def test_rejects_zero_days(self):
        with self.assertRaises(ValidationError):
            TripRequest(**{"from": "Kadapa", "to": "Tirupati", "travellers": 2, "days": 0})

    def test_rejects_overlong_location_input(self):
        with self.assertRaises(ValidationError):
            TripRequest(**{"from": "A" * 201, "to": "Tirupati"})
        with self.assertRaises(ValidationError):
            TripRequest(**{"from": "Kadapa", "to": "T" * 201})

    def test_rejects_empty_destination(self):
        with self.assertRaises(ValidationError):
            TripRequest(**{"from": "Kadapa", "to": ""})

    def test_live_place_search_requires_a_useful_query(self):
        with self.assertRaises(ValidationError):
            PlaceSearchRequest(query="ab")
        self.assertEqual(PlaceSearchRequest(query="Kadapa").query, "Kadapa")

    def test_live_place_search_restricts_category(self):
        self.assertEqual(PlaceSearchRequest(query="Kadapa", category="rentals").category, "rentals")
        with self.assertRaises(ValidationError):
            PlaceSearchRequest(query="Kadapa", category="booking")

    def test_ai_plan_is_grounded_in_named_provider_places(self):
        context = {
            "trip": {"days": 2},
            "nearbyPlaces": [
                {"name": "Kadapa Fort", "status": "LIVE"},
                {"name": "Ameen Peer Dargah", "status": "LIVE"},
            ],
        }
        raw = {
            "summary": "Invented timings and venue claims",
            "days": [
                {"title": "Day One", "summary": "Open every morning", "activities": [
                    {"title": "Visit Kadapa Fort at 8 AM"},
                    {"title": "Made-up Palace"}
                ]}
            ],
            "dataWarnings": [],
        }
        grounded = ground_ai_plan(raw, context)
        self.assertEqual(grounded["summary"].startswith("Draft suggestions are grounded"), True)
        self.assertEqual([item["title"] for item in grounded["days"][0]["activities"]], ["Kadapa Fort"])
        self.assertEqual([item["title"] for item in grounded["days"][1]["activities"]], ["Ameen Peer Dargah"])
        self.assertNotIn("8 AM", grounded["days"][0]["activities"][0]["description"])

    def test_ai_plan_does_not_invent_venues_when_source_list_is_empty(self):
        grounded = ground_ai_plan(
            {"days": [{"activities": ["Fake Palace"]}]},
            {"trip": {"days": 1}, "nearbyPlaces": []},
        )
        self.assertEqual(grounded["days"][0]["activities"], [])
        self.assertTrue(any("No named nearby places" in warning for warning in grounded["dataWarnings"]))

    def test_external_websites_only_allow_http_schemes(self):
        self.assertEqual(safe_http_url("example.com"), "https://example.com")
        self.assertEqual(safe_http_url("https://example.com/path"), "https://example.com/path")
        self.assertIsNone(safe_http_url("javascript:alert(1)"))
        self.assertIsNone(safe_http_url("data:text/html,hello"))
        self.assertIsNone(safe_http_url(""))

    def test_cache_round_trip(self):
        key = "test:cache-round-trip"
        value = {"status": "LIVE", "name": "example"}
        put_cache(key, value)
        self.assertEqual(cached(key), value)

    def test_cache_stays_bounded(self):
        for index in range(1005):
            put_cache(f"test:bounded:{index}", {"index": index})
        self.assertLessEqual(len(_cache), 1000)


if __name__ == "__main__":
    unittest.main()
