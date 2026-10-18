"""Offline contract and failure tests for the public food sync."""

from datetime import datetime, timezone
import importlib.util
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import Mock, patch

SPEC = importlib.util.spec_from_file_location(
    "sync_food", Path(__file__).resolve().parents[1] / "scripts/sync_food.py")
food = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(food)


def payload(spots=None):
    if spots is None:
        spots = [{"name": "老街面馆", "city": "上海", "address": "老街 1 号",
                  "lng": 121.47, "lat": 31.23, "category": "面食",
                  "articleUrl": "https://cachetide.top/food-map/noodles",
                  "rating": 5, "price": 30, "comments": ["private"],
                  "contact": "private", "profile": {"private": True}}]
    return json.dumps({"schemaVersion": 1, "coordinateSystem": "GCJ02", "spots": spots},
                      ensure_ascii=False).encode("utf-8")


class FoodSyncTests(unittest.TestCase):
    def test_federated_echoes_are_not_imported_again(self):
        row = json.loads(payload())["spots"][0]
        local = dict(row, source={"type": "local", "jsonUrl": food.SOURCE_URL})
        echo = dict(row, name="Imported echo", source={"type": "external", "jsonUrl": "https://frostmoonrui.com/food-map/index.json"})
        self.assertEqual(len(food.sanitize(payload([local, echo]))["spots"]), 1)

    def test_whitelist_and_original_names(self):
        document = food.sanitize(payload())
        item = document["spots"][0]
        self.assertEqual(set(item), {"id", "name", "city", "address", "lng", "lat",
                                     "coordinateSystem", "category", "articleUrl", "sourceName"})
        self.assertEqual(item["name"], "老街面馆")
        self.assertEqual(document["sourceUrl"], food.SOURCE_URL)
        self.assertEqual(document["coordinateSystem"], "GCJ-02")
        self.assertEqual(item["coordinateSystem"], "GCJ-02")
        self.assertEqual(item["sourceName"], "CacheTide")

    def test_normalized_deduplication_and_stable_order(self):
        first = json.loads(payload())["spots"][0]
        other = dict(first, name="  老街面馆  ", lng=121.47000001)
        self.assertEqual(len(food.sanitize(payload([first, other]))["spots"]), 1)
        second = dict(first, name="Second place")
        self.assertEqual(food.sanitize(payload([first, second])),
                         food.sanitize(payload([second, first])))
        variants = [dict(first, name=" Cafe "), dict(first, name="ＣＡＦＥ")]
        self.assertEqual(len(food.sanitize(payload(variants))["spots"]), 1)

    def test_url_restrictions(self):
        for url in ("http://cachetide.top/a", "https://evil.example/a",
                    "https://cachetide.top.evil.example/a", "https://user@cachetide.top/a",
                    "https://cachetide.top:444/a", "https://127.0.0.1/a",
                    "https://cachetide.top/a\nb", "//cachetide.top/a"):
            with self.subTest(url=url), self.assertRaises(ValueError):
                food.public_url(url)

    def test_invalid_feed_and_limits(self):
        base = json.loads(payload())
        cases = [b"not json", b"[]", b"x" * (food.MAX_BYTES + 1)]
        for changes in ({"schemaVersion": 2}, {"schemaVersion": True},
                        {"coordinateSystem": "WGS84"}, {"spots": {}},
                        {"spots": [{}] * (food.MAX_ENTRIES + 1)}):
            cases.append(json.dumps(dict(base, **changes)).encode())
        for body in cases:
            with self.subTest(size=len(body)), self.assertRaises(ValueError):
                food.sanitize(body)
        for changes in ({"lng": True}, {"lat": 91}, {"lng": float("nan")},
                        {"lat": float("inf")}, {"name": ""},
                        {"coordinateSystem": "WGS84"}, {"articleUrl": "https://elsewhere.test"}):
            with self.subTest(changes=changes), self.assertRaises(ValueError):
                food.sanitize(payload([dict(base["spots"][0], **changes)]))

    def test_atomic_output_timestamp_and_semantic_noop(self):
        with tempfile.TemporaryDirectory() as directory:
            output = Path(directory) / "data/food.json"
            before = datetime.now(timezone.utc).replace(microsecond=0)
            self.assertTrue(food.sync(output, lambda: payload()))
            saved = output.read_bytes()
            timestamp = datetime.fromisoformat(json.loads(saved)["retrievedAt"].replace("Z", "+00:00"))
            self.assertGreaterEqual(timestamp, before)
            self.assertLessEqual(timestamp, datetime.now(timezone.utc))
            self.assertFalse(food.sync(output, lambda: payload()))
            self.assertEqual(output.read_bytes(), saved)
            for fetch in (lambda: b"broken", Mock(side_effect=OSError("offline"))):
                with self.assertRaises((ValueError, OSError)):
                    food.sync(output, fetch)
                self.assertEqual(output.read_bytes(), saved)
            with patch.object(food.os, "replace", side_effect=OSError("replace failed")):
                with self.assertRaises(OSError):
                    food.sync(output, lambda: payload([]))
            self.assertEqual(output.read_bytes(), saved)
            self.assertEqual(list(output.parent.glob(".food-*.tmp")), [])

    @patch.object(food, "getproxies_environment", return_value={})
    @patch.object(food.socket, "getaddrinfo")
    @patch.object(food, "PublicConnection")
    def test_no_private_fetch(self, connection, resolve, proxies):
        for address in ("127.0.0.1", "10.0.0.1", "169.254.169.254", "::1", "fc00::1"):
            resolve.return_value = [(None, None, None, None, (address, 443))]
            with self.subTest(address=address), self.assertRaises(ValueError):
                food.fetch_feed()
        connection.assert_not_called()

    @patch.object(food, "getproxies_environment", return_value={})
    @patch.object(food.socket, "getaddrinfo", return_value=[(None, None, None, None, ("1.1.1.1", 443))])
    @patch.object(food, "PublicConnection")
    def test_response_bounds_and_redirect_rejection(self, factory, resolve, proxies):
        response = factory.return_value.getresponse.return_value
        response.getheader.side_effect = lambda name, default=None: default
        for status in (301, 302, 307, 404, 500):
            response.status = status
            with self.assertRaises(ValueError):
                food.fetch_feed()
        response.status = 200
        response.read.return_value = b"x" * (food.MAX_BYTES + 1)
        with self.assertRaises(ValueError):
            food.fetch_feed()
        response.getheader.side_effect = lambda name, default=None: str(food.MAX_BYTES + 1) if name == "Content-Length" else default
        with self.assertRaises(ValueError):
            food.fetch_feed()
        response.getheader.side_effect = lambda name, default=None: "gzip" if name == "Content-Encoding" else default
        with self.assertRaises(ValueError):
            food.fetch_feed()
        response.getheader.side_effect = lambda name, default=None: default
        response.read.return_value = payload()
        self.assertEqual(food.fetch_feed(), payload())
        response.read.assert_called_with(food.MAX_BYTES + 1)
        factory.return_value.close.assert_called()

    @patch.object(food, "getproxies_environment", return_value={"https": "http://127.0.0.1:7890"})
    @patch.object(food, "build_opener")
    def test_explicit_proxy_and_redirect_guard(self, build, proxies):
        response = build.return_value.open.return_value
        response.status = 200
        response.getheader.side_effect = lambda name, default=None: default
        response.read.return_value = payload()
        with patch.object(food.socket, "getaddrinfo", side_effect=AssertionError("No local DNS")):
            self.assertEqual(food.fetch_feed(), payload())
        handlers = build.call_args.args
        self.assertIsInstance(handlers[1], food.NoRedirect)
        self.assertEqual(handlers[0].proxies["https"], "http://127.0.0.1:7890")
        with self.assertRaises(ValueError):
            handlers[1].redirect_request(None, None, 302, "Found", {}, "http://127.0.0.1")
        response.close.assert_called_once()

    def test_cli_failure_is_nonzero(self):
        with patch.object(food, "sync", side_effect=ValueError("bad feed")):
            self.assertEqual(food.main([]), 1)


if __name__ == "__main__":
    unittest.main()
