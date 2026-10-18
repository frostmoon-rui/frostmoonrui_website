"""Sync CacheTide's public food feed using only the standard library."""

import argparse
from datetime import datetime, timezone
import hashlib
import http.client
import ipaddress
import json
import math
import os
from pathlib import Path
import socket
import ssl
import sys
import tempfile
import unicodedata
from urllib.parse import urlsplit, urlunsplit
from urllib.request import (HTTPRedirectHandler, ProxyHandler, Request,
                            build_opener, getproxies_environment)

SOURCE_URL = "https://cachetide.top/food-map/index.json"
SOURCE_HOST = "cachetide.top"
MAX_BYTES = 2 * 1024 * 1024
MAX_ENTRIES = 5000
DEFAULT_OUTPUT = Path(__file__).resolve().parents[1] / "dist/data/food.json"


def public_url(value):
    """Allow only HTTPS links to the fixed public source host."""
    if not isinstance(value, str) or any(ord(c) < 33 for c in value):
        raise ValueError("Invalid source URL")
    parsed = urlsplit(value)
    if (parsed.scheme != "https" or parsed.hostname != SOURCE_HOST
            or parsed.username is not None or parsed.password is not None
            or parsed.port not in (None, 443) or "\\" in value):
        raise ValueError("Expected HTTPS on the fixed source host")
    return urlunsplit(("https", SOURCE_HOST, parsed.path or "/", parsed.query, ""))


class PublicConnection(http.client.HTTPSConnection):
    """Pin direct connections to a validated public IP, retaining TLS SNI."""

    def __init__(self, address):
        super().__init__(SOURCE_HOST, timeout=30, context=ssl.create_default_context())
        self.public_address = address

    def connect(self):
        raw = socket.create_connection((self.public_address, 443), self.timeout)
        try:
            self.sock = self._context.wrap_socket(raw, server_hostname=SOURCE_HOST)
        except BaseException:
            raw.close()
            raise


class NoRedirect(HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        raise ValueError("Source redirects are disabled")


def fetch_feed():
    """Fetch the fixed feed with bounded reads and no redirect following.

    An explicit HTTPS_PROXY is a trusted operator transport and may be local.
    Direct connections pin the public DNS result; a proxy resolves the fixed
    source hostname itself. No feed-supplied URLs are fetched.
    """
    public_url(SOURCE_URL)
    headers = {"Accept": "application/json", "Accept-Encoding": "identity",
               "User-Agent": "FrostmoonFoodAtlas/1.0 (+https://frostmoonrui.com)"}
    proxy = getproxies_environment().get("https")
    connection = None
    response = None
    try:
        if proxy:
            opener = build_opener(ProxyHandler({"https": proxy}), NoRedirect())
            response = opener.open(Request(SOURCE_URL, headers=headers), timeout=30)
        else:
            addresses = sorted({item[4][0] for item in socket.getaddrinfo(
                SOURCE_HOST, 443, type=socket.SOCK_STREAM)})
            if not addresses or any(not ipaddress.ip_address(ip).is_global for ip in addresses):
                raise ValueError("Source DNS must resolve exclusively to public addresses")
            connection = PublicConnection(addresses[0])
            connection.request("GET", urlsplit(SOURCE_URL).path, headers=headers)
            response = connection.getresponse()
        if response.status != 200:
            raise ValueError("Expected HTTP 200; redirects are disabled")
        if response.getheader("Content-Encoding", "identity").lower() != "identity":
            raise ValueError("Compressed responses are not accepted")
        length = response.getheader("Content-Length")
        if length is not None and (int(length) < 0 or int(length) > MAX_BYTES):
            raise ValueError("Source exceeds the 2 MiB limit")
        body = response.read(MAX_BYTES + 1)
        if len(body) > MAX_BYTES:
            raise ValueError("Source exceeds the 2 MiB limit")
        return body
    finally:
        if response is not None:
            response.close()
        if connection is not None:
            connection.close()


def clean_text(value, field, required=False):
    if not isinstance(value, str):
        raise ValueError("Invalid text field: " + field)
    value = " ".join(unicodedata.normalize("NFC", value).split())
    if (required and not value) or len(value) > 4096 or any(
            unicodedata.category(char).startswith("C") for char in value):
        raise ValueError("Invalid text field: " + field)
    return value


def sanitize(body):
    if len(body) > MAX_BYTES:
        raise ValueError("Source exceeds the 2 MiB limit")
    feed = json.loads(body)
    if (not isinstance(feed, dict) or type(feed.get("schemaVersion")) is not int
            or feed["schemaVersion"] != 1):
        raise ValueError("Expected source schemaVersion 1")
    if feed.get("coordinateSystem") not in ("GCJ02", "GCJ-02"):
        raise ValueError("Expected GCJ02 coordinates")
    spots = feed.get("spots")
    if not isinstance(spots, list) or len(spots) > MAX_ENTRIES:
        raise ValueError("Expected at most 5000 spots")
    unique = {}
    for spot in spots:
        if not isinstance(spot, dict):
            raise ValueError("Each spot must be an object")
        item = {key: clean_text(spot.get(key, ""), key, key == "name")
                for key in ("name", "city", "address", "category")}
        for key, bound in (("lng", 180), ("lat", 90)):
            value = spot.get(key)
            if type(value) not in (int, float) or not math.isfinite(value) or not -bound <= value <= bound:
                raise ValueError("Invalid coordinate: " + key)
            item[key] = round(float(value), 6) or 0.0
        if spot.get("coordinateSystem", "GCJ02") not in ("GCJ02", "GCJ-02"):
            raise ValueError("Mixed coordinate systems are not accepted")
        article = spot.get("articleUrl", "")
        item["articleUrl"] = public_url(article) if article else ""
        item["coordinateSystem"] = "GCJ-02"
        item["sourceName"] = "CacheTide"
        identity = [unicodedata.normalize("NFKC", item[key]).casefold()
                    for key in ("name", "city", "address")]
        identity.extend(item[key] for key in ("lng", "lat"))
        digest = hashlib.sha256(json.dumps(identity, ensure_ascii=False).encode("utf-8")).hexdigest()
        item["id"] = digest[:24]
        previous = unique.get(item["id"])
        if previous is None or json.dumps(item, sort_keys=True) < json.dumps(previous, sort_keys=True):
            unique[item["id"]] = item
    return {"schemaVersion": 1, "coordinateSystem": "GCJ-02",
            "sourceUrl": SOURCE_URL, "sourceName": "CacheTide",
            "spots": sorted(unique.values(), key=lambda item: item["id"])}


def sync(output=DEFAULT_OUTPUT, fetch=fetch_feed):
    """Replace output atomically; retain retrievedAt for unchanged public data."""
    document = sanitize(fetch())
    output = Path(output)
    try:
        existing = json.loads(output.read_text(encoding="utf-8"))
    except (FileNotFoundError, ValueError, UnicodeError):
        existing = None
    if isinstance(existing, dict):
        semantic = {key: value for key, value in existing.items() if key != "retrievedAt"}
        if semantic == document and isinstance(existing.get("retrievedAt"), str):
            return False
    document["retrievedAt"] = datetime.now(timezone.utc).isoformat(timespec="seconds").replace("+00:00", "Z")
    encoded = (json.dumps(document, ensure_ascii=False, indent=2, allow_nan=False) + "\n").encode("utf-8")
    if len(encoded) > MAX_BYTES:
        raise ValueError("Sanitized output exceeds the 2 MiB limit")
    output.parent.mkdir(parents=True, exist_ok=True)
    temporary = None
    try:
        with tempfile.NamedTemporaryFile(dir=output.parent, prefix=".food-", suffix=".tmp", delete=False) as handle:
            temporary = handle.name
            handle.write(encoded)
            handle.flush()
            os.fsync(handle.fileno())
        os.replace(temporary, output)
    finally:
        if temporary and os.path.exists(temporary):
            os.unlink(temporary)
    return True


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    args = parser.parse_args(argv)
    try:
        changed = sync(args.output)
    except Exception:
        # Transport exceptions can include operator proxy credentials.
        print("Food sync failed; existing output was preserved.", file=sys.stderr)
        return 1
    print("Food data updated." if changed else "Food data unchanged.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
