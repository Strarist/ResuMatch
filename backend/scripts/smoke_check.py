#!/usr/bin/env python3
"""Lightweight staging smoke checks for core API availability."""

import os
import sys
import urllib.error
import urllib.request

BASE = os.environ.get("SMOKE_BASE_URL", "http://127.0.0.1:8000").rstrip("/")

CHECKS = [
    ("health", f"{BASE}/health"),
    ("openapi", f"{BASE}/docs"),
]


def check(name: str, url: str) -> bool:
    try:
        with urllib.request.urlopen(url, timeout=10) as resp:
            ok = 200 <= resp.status < 400
            print(f"[{'OK' if ok else 'FAIL'}] {name} {url} -> {resp.status}")
            return ok
    except urllib.error.HTTPError as e:
        print(f"[FAIL] {name} {url} -> HTTP {e.code}")
        return False
    except Exception as e:
        print(f"[FAIL] {name} {url} -> {e}")
        return False


def main() -> int:
    print(f"Smoke check base: {BASE}")
    results = [check(name, url) for name, url in CHECKS]
    if all(results):
        print("Smoke check passed.")
        return 0
    print("Smoke check failed.")
    return 1


if __name__ == "__main__":
    sys.exit(main())
