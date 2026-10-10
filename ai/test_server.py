import unittest
from unittest.mock import AsyncMock, patch

import server
from pydantic import ValidationError

from server import (LocalGuideQuestion, LocalGuideRequest, LocalWalkingRouteRequest, PlaceSearchRequest, TripRequest, _cache, cached, classify_local_guide_place, create_local_guide_answer, ground_ai_plan, haversine_distance_m, nearby_local_guide, pedestrian_route, put_cache, safe_http_url)


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




class PedestrianRoutingTests(unittest.IsolatedAsyncioTestCase):
    async def test_returns_actual_route_distance_and_duration_from_valhalla(self):
        class FakeResponse:
            def raise_for_status(self):
                return None

            def json(self):
                return {"trip": {"summary": {"length": 0.72, "time": 510}}}

        client = type("FakeClient", (), {})()
        client.post = AsyncMock(return_value=FakeResponse())
        with patch.object(server, "VALHALLA_MIN_INTERVAL_SECONDS", 0):
            result = await pedestrian_route(
                client,
                {"latitude": 14.47001, "longitude": 78.82001},
                {"latitude": 14.47211, "longitude": 78.82321},
            )

        self.assertEqual(result["status"], "LIVE")
        self.assertEqual(result["distanceMeters"], 720)
        self.assertEqual(result["durationMinutes"], 9)
        self.assertEqual(result["provider"], "Valhalla pedestrian routing")
        payload = client.post.await_args.kwargs["json"]
        self.assertEqual(payload["costing"], "pedestrian")
        self.assertEqual(payload["units"], "kilometers")

    async def test_rejects_malformed_route_response_instead_of_fabricating(self):
        class FakeResponse:
            def raise_for_status(self):
                return None

            def json(self):
                return {"trip": {"summary": {"length": "unknown", "time": 50}}}

        client = type("FakeClient", (), {})()
        client.post = AsyncMock(return_value=FakeResponse())
        with patch.object(server, "VALHALLA_MIN_INTERVAL_SECONDS", 0):
            with self.assertRaises(server.HTTPException):
                await pedestrian_route(
                    client,
                    {"latitude": 30.00001, "longitude": 30.00001},
                    {"latitude": 30.00211, "longitude": 30.00321},
                )

    def test_walking_route_request_validates_all_coordinates(self):
        LocalWalkingRouteRequest(
            originLatitude=14.47, originLongitude=78.82,
            destinationLatitude=14.48, destinationLongitude=78.83,
        )
        with self.assertRaises(ValidationError):
            LocalWalkingRouteRequest(
                originLatitude=91, originLongitude=78.82,
                destinationLatitude=14.48, destinationLongitude=78.83,
            )


class LocalGuideTests(unittest.IsolatedAsyncioTestCase):
    def test_validates_coordinates_and_radius(self):
        LocalGuideRequest(latitude=14.47, longitude=78.82, radiusMeters=500)
        with self.assertRaises(ValidationError):
            LocalGuideRequest(latitude=91, longitude=78.82, radiusMeters=500)
        with self.assertRaises(ValidationError):
            LocalGuideRequest(latitude=14.47, longitude=78.82, radiusMeters=100)

    def test_haversine_distance_uses_metres(self):
        distance = haversine_distance_m(0, 0, 0.01, 0)
        self.assertGreater(distance, 1100)
        self.assertLess(distance, 1120)

    def test_categorizes_transport_food_and_essentials(self):
        self.assertEqual(classify_local_guide_place({"highway": "bus_stop"}), "transport")
        self.assertEqual(classify_local_guide_place({"amenity": "cafe"}), "food")
        self.assertEqual(classify_local_guide_place({"amenity": "pharmacy"}), "essentials")

    async def test_local_guide_sorts_nearby_places_and_marks_walk_time_as_estimated(self):
        class FakeResponse:
            def raise_for_status(self):
                return None

            def json(self):
                return {
                    "elements": [
                        {"type": "node", "id": 71001, "lat": 12.0, "lon": 22.002,
                         "tags": {"name": "Far Cafe", "amenity": "cafe"}},
                        {"type": "node", "id": 71002, "lat": 12.0, "lon": 22.001,
                         "tags": {"name": "Nearby Bus Stop", "highway": "bus_stop"}},
                        {"type": "node", "id": 71003, "lat": 12.0, "lon": 22.003,
                         "tags": {"name": "Pharmacy", "amenity": "pharmacy"}},
                    ]
                }

        client = type("FakeClient", (), {})()
        client.post = AsyncMock(return_value=FakeResponse())
        results = await nearby_local_guide(client, 12.0, 22.0, radius_m=1000)
        self.assertIn("\n", client.post.await_args.kwargs["data"]["data"])
        self.assertEqual(results[0]["name"], "Nearby Bus Stop")
        self.assertEqual(results[0]["guideCategory"], "transport")
        self.assertEqual(results[1]["guideCategory"], "food")
        self.assertEqual(results[0]["distanceStatus"], "ESTIMATED")
        self.assertGreaterEqual(results[0]["estimatedWalkMinutes"], 1)
        self.assertIn("not a routed walking time", results[0]["estimatedWalkNote"])
        self.assertEqual(results[0]["provider"], "OpenStreetMap Overpass")


class LocalGuideQuestionTests(unittest.IsolatedAsyncioTestCase):
    def test_accepts_only_the_three_supported_languages_and_party_sizes(self):
        LocalGuideQuestion(question="Where can I eat?", language="en", travellers=1)
        LocalGuideQuestion(question="ఎక్కడ భోజనం చేయవచ్చు?", language="te", travellers=2)
        with self.assertRaises(ValidationError):
            LocalGuideQuestion(question="Where can I eat?", language="ta", travellers=1)
        with self.assertRaises(ValidationError):
            LocalGuideQuestion(question="Where can I eat?", language="en", travellers=3)
        with self.assertRaises(ValidationError):
            LocalGuideQuestion(question="ok", language="en", travellers=1)

    async def test_answer_prompt_uses_selected_language_and_nearby_context(self):
        class FakeResponse:
            def raise_for_status(self):
                return None

            def json(self):
                return {"message": {"content": "మీరు ముందుగా నడక మార్గాన్ని తనిఖీ చేయండి."}}

        class FakeClient:
            payload = None

            async def post(self, url, **kwargs):
                self.payload = kwargs["json"]
                return FakeResponse()

        fake_client = FakeClient()

        class FakeClientContext:
            async def __aenter__(self):
                return fake_client

            async def __aexit__(self, exc_type, exc_value, traceback):
                return False

        request = LocalGuideQuestion(
            question="ఎక్కడ భోజనం చేయవచ్చు?",
            language="te",
            travellers=1,
            places=[{
                "name": "Nearby Cafe",
                "guideCategory": "food",
                "distanceMeters": 250,
                "estimatedWalkMinutes": 5,
                "provider": "OpenStreetMap Overpass",
            }],
        )
        with patch("server.httpx.AsyncClient", return_value=FakeClientContext()):
            answer = await create_local_guide_answer(request)

        self.assertIn("నడక మార్గాన్ని", answer)
        self.assertIn("Answer entirely in Telugu", fake_client.payload["messages"][0]["content"])
        self.assertIn("Nearby Cafe", fake_client.payload["messages"][1]["content"])
        self.assertEqual(fake_client.payload["options"]["temperature"], 0.2)


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
