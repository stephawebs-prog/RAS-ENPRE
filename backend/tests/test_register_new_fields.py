"""Tests for new entrepreneur registration fields:
logo_url, cover_url (base64), linkedin, tiktok, youtube and combined phone field.
"""
import os
import time
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://creator-connect-302.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"

# tiny 1x1 PNG, base64 encoded (~70 bytes data URL)
TINY_PNG_B64 = (
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR4"
    "nGP4//8/AwAI/AL+BfXaXgAAAABJRU5ErkJggg=="
)


@pytest.fixture(scope="module")
def fresh_email():
    return f"e2e_new_{int(time.time())}@example.com"


@pytest.fixture(scope="module")
def registered(fresh_email):
    payload = {
        "email": fresh_email,
        "password": "Demo@2026",
        "business_name": "TEST New Fields Co",
        "owner_name": "TEST Owner",
        "category": "technology",
        "description": "TEST entrepreneur with all new optional fields populated.",
        "phone": "+1 555 010 4242",
        "city": "Odessa",
        "state": "TX",
        "country": "US",
        "address": "123 TEST St",
        "website": "https://example.com",
        "logo_url": TINY_PNG_B64,
        "cover_url": TINY_PNG_B64,
        "facebook": "fbhandle",
        "instagram": "@inst",
        "twitter": "@tw",
        "whatsapp": "+15550104242",
        "linkedin": "linkedin.com/in/test",
        "tiktok": "@tiktokhandle",
        "youtube": "youtube.com/@test",
        "source": "Google",
    }
    r = requests.post(f"{API}/auth/register-entrepreneur", json=payload, timeout=30)
    return r, payload


def test_register_with_all_new_fields_returns_200(registered):
    r, _ = registered
    assert r.status_code == 200, f"Expected 200 got {r.status_code}: {r.text}"
    body = r.json()
    assert "user" in body and "profile" in body and "access_token" in body


def test_profile_persists_logo_cover_and_socials(registered):
    r, payload = registered
    assert r.status_code == 200
    profile = r.json()["profile"]
    # verify logo/cover are stored as data URLs
    assert profile["logo_url"].startswith("data:image/"), "logo_url not stored"
    assert profile["cover_url"].startswith("data:image/"), "cover_url not stored"
    # verify new social fields
    assert profile["linkedin"] == payload["linkedin"]
    assert profile["tiktok"] == payload["tiktok"]
    assert profile["youtube"] == payload["youtube"]
    # combined phone preserved
    assert profile["phone"] == payload["phone"]


def test_get_entrepreneurs_includes_new_fields(registered):
    r, payload = registered
    assert r.status_code == 200
    token = r.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    listing = requests.get(f"{API}/entrepreneurs?q=TEST New Fields", headers=headers, timeout=30)
    assert listing.status_code == 200
    items = listing.json().get("items", [])
    found = next((i for i in items if i["business_name"] == payload["business_name"]), None)
    assert found is not None, "Newly registered business not in listing"
    assert "logo_url" in found and "cover_url" in found
    assert "linkedin" in found and "tiktok" in found and "youtube" in found
    assert found["linkedin"] == payload["linkedin"]
    assert found["tiktok"] == payload["tiktok"]
    assert found["youtube"] == payload["youtube"]
    assert found["logo_url"].startswith("data:image/")


def test_register_minimal_step3_optional():
    """Step 3 fields optional: register without logo/cover/socials must succeed."""
    email = f"e2e_min_{int(time.time())}@example.com"
    payload = {
        "email": email,
        "password": "Demo@2026",
        "business_name": "TEST Minimal",
        "owner_name": "TEST Min Owner",
        "category": "other",
        "description": "Minimal description with required length.",
        "phone": "+57 300 555 1234",
        "city": "Bogota",
        "country": "CO",
    }
    r = requests.post(f"{API}/auth/register-entrepreneur", json=payload, timeout=30)
    assert r.status_code == 200, f"Minimal register failed: {r.status_code} {r.text}"
    p = r.json()["profile"]
    assert p["logo_url"] == ""
    assert p["linkedin"] == ""
    assert p["tiktok"] == ""
    assert p["youtube"] == ""


def test_admin_login_regression():
    r = requests.post(
        f"{API}/auth/login",
        json={"email": "admin@redsolidaridad.com", "password": "Admin@RED2026"},
        timeout=15,
    )
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["user"]["role"] == "admin"
    assert body["access_token"]
