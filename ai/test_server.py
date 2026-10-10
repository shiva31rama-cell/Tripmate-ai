import unittest

from pydantic import ValidationError

from server import PlaceSearchRequest, TripRequest, _cache, cached, put_cache, safe_http_url


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
