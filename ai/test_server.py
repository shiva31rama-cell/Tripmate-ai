import unittest

from pydantic import ValidationError

from server import PlaceSearchRequest, TripRequest, _cache, cached, ground_ai_plan, put_cache, safe_http_url


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
