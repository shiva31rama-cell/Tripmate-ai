import unittest

from pydantic import ValidationError

from server import TripRequest, cached, put_cache


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

    def test_cache_round_trip(self):
        key = "test:cache-round-trip"
        value = {"status": "LIVE", "name": "example"}
        put_cache(key, value)
        self.assertEqual(cached(key), value)


if __name__ == "__main__":
    unittest.main()
