"""Backend API tests for Red de Amor y Solidaridad.

Each test function uses a fresh requests.Session() to avoid shared cookies
(backend sets httpOnly cookies on auth endpoints which would pollute
tests that must verify "no-auth" behavior).
"""
import os
import uuid
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://creator-connect-302.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"

# Test credentials are loaded from env (.env). The same values are used by
# the backend admin seeding so tests can authenticate as the seeded users.
ADMIN_EMAIL = os.environ.get("ADMIN_EMAIL", "admin@redsolidaridad.com")
ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD", "Admin@RED2026")
ENT_EMAIL = os.environ.get("TEST_ENT_EMAIL", "maria@elsolcatering.com")
ENT_PASSWORD = os.environ.get("TEST_ENT_PASSWORD", "Demo@2026")
CLIENT_EMAIL = os.environ.get("TEST_CLIENT_EMAIL", "cliente@demo.com")
CLIENT_PASSWORD = os.environ.get("TEST_CLIENT_PASSWORD", "Demo@2026")

CATEGORIES = [
    "restaurants", "professional_services", "health_wellness", "technology",
    "construction", "beauty", "education", "retail", "arts_entertainment",
    "automotive", "food_beverage", "other",
]


# ------------- Helpers -------------
def new_client():
    """Fresh client that does NOT persist cookies between requests."""
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    # disable automatic cookie sending by installing a no-op cookie jar
    s.cookies = requests.cookies.RequestsCookieJar()
    return s


def login_token(email, password):
    # Use a throwaway session so cookies don't leak
    r = requests.post(f"{API}/auth/login", json={"email": email, "password": password})
    assert r.status_code == 200, f"Login {email} -> {r.status_code} {r.text}"
    return r.json()["access_token"]


def auth_headers(token):
    return {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}


# ------------- Fixtures (session-scoped tokens) -------------
@pytest.fixture(scope="session")
def admin_token():
    return login_token(ADMIN_EMAIL, ADMIN_PASSWORD)


@pytest.fixture(scope="session")
def ent_token():
    return login_token(ENT_EMAIL, ENT_PASSWORD)


@pytest.fixture(scope="session")
def client_token():
    return login_token(CLIENT_EMAIL, CLIENT_PASSWORD)


# ------------- Categories -------------
class TestCategories:
    def test_categories_returns_12(self):
        r = requests.get(f"{API}/categories")
        assert r.status_code == 200
        data = r.json()
        assert len(data["categories"]) == 12
        assert set(data["categories"]) == set(CATEGORIES)


# ------------- Auth -------------
class TestAuth:
    def test_login_admin(self):
        r = requests.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
        assert r.status_code == 200
        d = r.json()
        assert d["user"]["role"] == "admin"
        assert d["user"]["email"] == ADMIN_EMAIL
        assert isinstance(d["access_token"], str) and len(d["access_token"]) > 20

    def test_login_entrepreneur(self):
        r = requests.post(f"{API}/auth/login", json={"email": ENT_EMAIL, "password": ENT_PASSWORD})
        assert r.status_code == 200
        assert r.json()["user"]["role"] == "entrepreneur"

    def test_login_client(self):
        r = requests.post(f"{API}/auth/login", json={"email": CLIENT_EMAIL, "password": CLIENT_PASSWORD})
        assert r.status_code == 200
        assert r.json()["user"]["role"] == "client"

    def test_login_invalid(self):
        r = requests.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": "wrong"})
        assert r.status_code == 401

    def test_me_entrepreneur_has_profile(self, ent_token):
        r = requests.get(f"{API}/auth/me", headers=auth_headers(ent_token))
        assert r.status_code == 200
        d = r.json()
        assert d["user"]["role"] == "entrepreneur"
        assert d["profile"] is not None
        assert d["profile"]["business_name"].startswith("El Sol Catering")

    def test_me_client_no_profile(self, client_token):
        r = requests.get(f"{API}/auth/me", headers=auth_headers(client_token))
        assert r.status_code == 200
        d = r.json()
        assert d["user"]["role"] == "client"
        assert d["profile"] is None

    def test_me_no_auth(self):
        r = requests.get(f"{API}/auth/me")
        assert r.status_code == 401

    def test_register_entrepreneur(self, admin_token):
        email = f"test_ent_{uuid.uuid4().hex[:8]}@test.com"
        payload = {
            "email": email, "password": "Test@1234",
            "business_name": "Test Biz", "owner_name": "Tester Name",
            "category": "technology",
            "description": "A lovely test business that does many things.",
            "phone": "+1 555 000 1111", "city": "Austin", "state": "TX",
        }
        r = requests.post(f"{API}/auth/register-entrepreneur", json=payload)
        assert r.status_code == 200, r.text
        d = r.json()
        assert "access_token" in d
        # backend lowercases email
        assert d["user"]["email"] == email.lower()
        assert d["user"]["role"] == "entrepreneur"
        assert d["profile"]["business_name"] == "Test Biz"
        assert d["profile"]["category"] == "technology"
        # verify me
        me = requests.get(f"{API}/auth/me", headers=auth_headers(d["access_token"]))
        assert me.status_code == 200
        assert me.json()["profile"]["business_name"] == "Test Biz"
        # Cleanup
        requests.delete(f"{API}/admin/entrepreneurs/{d['profile']['id']}",
                        headers=auth_headers(admin_token))

    def test_register_entrepreneur_bad_category(self):
        email = f"test_bad_{uuid.uuid4().hex[:8]}@test.com"
        r = requests.post(f"{API}/auth/register-entrepreneur", json={
            "email": email, "password": "Test@1234",
            "business_name": "Bad Biz", "owner_name": "Owner Name",
            "category": "INVALID_CAT",
            "description": "This is a valid length description here.",
            "phone": "+1 555 0001", "city": "Austin",
        })
        assert r.status_code == 400, r.text

    def test_register_entrepreneur_duplicate(self):
        r = requests.post(f"{API}/auth/register-entrepreneur", json={
            "email": ENT_EMAIL, "password": "Test@1234",
            "business_name": "Dup Biz", "owner_name": "Owner Name",
            "category": "other",
            "description": "A duplicate email test description here.",
            "phone": "+1 555 0002", "city": "Austin",
        })
        assert r.status_code == 400, r.text

    def test_register_entrepreneur_short_password(self):
        r = requests.post(f"{API}/auth/register-entrepreneur", json={
            "email": f"short_{uuid.uuid4().hex[:6]}@t.com", "password": "123",
            "business_name": "X Biz", "owner_name": "Owner Name",
            "category": "other",
            "description": "Description long enough for validation.",
            "phone": "+1 555 0004", "city": "Austin",
        })
        assert r.status_code == 422

    def test_register_client(self, admin_token):
        email = f"test_cli_{uuid.uuid4().hex[:8]}@test.com"
        payload = {
            "email": email, "password": "Test@1234",
            "full_name": "Client Tester", "phone": "+1 555 0000",
            "city": "Austin", "state": "TX",
            "interests": ["food_beverage", "beauty", "not_a_category"],
        }
        r = requests.post(f"{API}/auth/register-client", json=payload)
        assert r.status_code == 200
        d = r.json()
        assert "access_token" in d
        assert d["user"]["role"] == "client"
        # invalid interest filtered out
        assert "not_a_category" not in d["user"]["interests"]
        assert "food_beverage" in d["user"]["interests"]
        # cleanup
        requests.delete(f"{API}/admin/clients/{d['user']['id']}",
                        headers=auth_headers(admin_token))


# ------------- Entrepreneurs -------------
class TestEntrepreneurs:
    def test_list_requires_auth(self):
        r = requests.get(f"{API}/entrepreneurs")
        assert r.status_code == 401

    def test_list_with_auth(self, client_token):
        r = requests.get(f"{API}/entrepreneurs", headers=auth_headers(client_token))
        assert r.status_code == 200
        d = r.json()
        assert d["total"] >= 1
        assert len(d["items"]) >= 1

    def test_list_filter_category(self, client_token):
        r = requests.get(f"{API}/entrepreneurs?category=food_beverage",
                         headers=auth_headers(client_token))
        assert r.status_code == 200
        for item in r.json()["items"]:
            assert item["category"] == "food_beverage"

    def test_list_filter_q(self, client_token):
        r = requests.get(f"{API}/entrepreneurs?q=Sol", headers=auth_headers(client_token))
        assert r.status_code == 200
        assert r.json()["total"] >= 1

    def test_list_filter_city(self, client_token):
        r = requests.get(f"{API}/entrepreneurs?city=Odessa", headers=auth_headers(client_token))
        assert r.status_code == 200
        for item in r.json()["items"]:
            assert "odessa" in item["city"].lower()

    def test_preview_no_auth(self):
        r = requests.get(f"{API}/entrepreneurs/preview?limit=6")
        assert r.status_code == 200
        d = r.json()
        assert len(d["items"]) <= 6
        assert d["total"] >= 1

    def test_detail_requires_auth(self):
        pr = requests.get(f"{API}/entrepreneurs/preview").json()
        eid = pr["items"][0]["id"]
        r = requests.get(f"{API}/entrepreneurs/{eid}")
        assert r.status_code == 401

    def test_detail_with_auth(self, client_token):
        pr = requests.get(f"{API}/entrepreneurs/preview").json()
        eid = pr["items"][0]["id"]
        r = requests.get(f"{API}/entrepreneurs/{eid}", headers=auth_headers(client_token))
        assert r.status_code == 200
        assert r.json()["id"] == eid

    def test_detail_404(self, client_token):
        r = requests.get(f"{API}/entrepreneurs/nonexistent-id",
                         headers=auth_headers(client_token))
        assert r.status_code == 404

    def test_update_me_entrepreneur(self, ent_token):
        new_desc = f"Updated description {uuid.uuid4().hex[:6]} for testing purposes."
        r = requests.put(f"{API}/entrepreneurs/me",
                         json={"description": new_desc},
                         headers=auth_headers(ent_token))
        assert r.status_code == 200, r.text
        assert r.json()["description"] == new_desc
        me = requests.get(f"{API}/auth/me", headers=auth_headers(ent_token))
        assert me.json()["profile"]["description"] == new_desc

    def test_update_me_client_forbidden(self, client_token):
        r = requests.put(f"{API}/entrepreneurs/me",
                         json={"description": "hello world desc"},
                         headers=auth_headers(client_token))
        assert r.status_code == 403

    def test_update_me_admin_forbidden(self, admin_token):
        r = requests.put(f"{API}/entrepreneurs/me",
                         json={"description": "hello world desc"},
                         headers=auth_headers(admin_token))
        assert r.status_code == 403


# ------------- Contact -------------
class TestContact:
    def test_contact_no_auth(self):
        r = requests.post(f"{API}/contact", json={
            "name": "TEST Contact User", "email": "test_contact@test.com",
            "message": "Hello this is a test message.",
        })
        assert r.status_code == 200
        assert r.json()["ok"] is True
        assert "id" in r.json()


# ------------- Admin -------------
class TestAdmin:
    def test_stats_requires_admin(self, client_token):
        r = requests.get(f"{API}/admin/stats", headers=auth_headers(client_token))
        assert r.status_code == 403

    def test_stats_no_auth(self):
        r = requests.get(f"{API}/admin/stats")
        assert r.status_code == 401

    def test_stats_admin(self, admin_token):
        r = requests.get(f"{API}/admin/stats", headers=auth_headers(admin_token))
        assert r.status_code == 200
        d = r.json()
        for k in ["entrepreneurs", "clients", "messages", "unread_messages", "featured"]:
            assert k in d
            assert isinstance(d[k], int)

    def test_admin_entrepreneurs_forbidden_for_client(self, client_token):
        r = requests.get(f"{API}/admin/entrepreneurs", headers=auth_headers(client_token))
        assert r.status_code == 403

    def test_admin_entrepreneurs_forbidden_for_entrepreneur(self, ent_token):
        r = requests.get(f"{API}/admin/entrepreneurs", headers=auth_headers(ent_token))
        assert r.status_code == 403

    def test_admin_list_entrepreneurs(self, admin_token):
        r = requests.get(f"{API}/admin/entrepreneurs", headers=auth_headers(admin_token))
        assert r.status_code == 200
        d = r.json()
        assert len(d["items"]) >= 1
        assert "email" in d["items"][0]

    def test_admin_toggle_featured(self, admin_token):
        r = requests.get(f"{API}/admin/entrepreneurs", headers=auth_headers(admin_token))
        items = r.json()["items"]
        eid = items[0]["id"]
        prev = bool(items[0].get("featured", False))
        rp = requests.patch(f"{API}/admin/entrepreneurs/{eid}",
                            json={"featured": not prev},
                            headers=auth_headers(admin_token))
        assert rp.status_code == 200
        assert rp.json()["featured"] == (not prev)
        # toggle back
        requests.patch(f"{API}/admin/entrepreneurs/{eid}",
                       json={"featured": prev},
                       headers=auth_headers(admin_token))

    def test_admin_delete_entrepreneur_full(self, admin_token):
        email = f"test_del_{uuid.uuid4().hex[:8]}@test.com"
        reg = requests.post(f"{API}/auth/register-entrepreneur", json={
            "email": email, "password": "Test@1234",
            "business_name": "DelMe Co", "owner_name": "Del Tester",
            "category": "other",
            "description": "description for delete testing purposes here.",
            "phone": "+1 555 0003", "city": "Austin",
        })
        assert reg.status_code == 200
        pid = reg.json()["profile"]["id"]
        d = requests.delete(f"{API}/admin/entrepreneurs/{pid}",
                            headers=auth_headers(admin_token))
        assert d.status_code == 200
        # detail 404
        rd = requests.get(f"{API}/entrepreneurs/{pid}", headers=auth_headers(admin_token))
        assert rd.status_code == 404
        # user must also be deleted -> can't login
        lg = requests.post(f"{API}/auth/login", json={"email": email, "password": "Test@1234"})
        assert lg.status_code == 401

    def test_admin_clients(self, admin_token):
        r = requests.get(f"{API}/admin/clients", headers=auth_headers(admin_token))
        assert r.status_code == 200
        for item in r.json()["items"]:
            assert item["role"] == "client"

    def test_admin_messages_and_mark_read(self, admin_token):
        c = requests.post(f"{API}/contact", json={
            "name": "TEST Mark Read", "email": "markread@test.com",
            "message": "Mark me as read please.",
        })
        mid = c.json()["id"]
        r = requests.get(f"{API}/admin/messages", headers=auth_headers(admin_token))
        assert r.status_code == 200
        mr = requests.patch(f"{API}/admin/messages/{mid}/read",
                            headers=auth_headers(admin_token))
        assert mr.status_code == 200
        assert mr.json()["read"] is True
        requests.delete(f"{API}/admin/messages/{mid}", headers=auth_headers(admin_token))

    def test_admin_messages_forbidden(self, client_token):
        r = requests.get(f"{API}/admin/messages", headers=auth_headers(client_token))
        assert r.status_code == 403

    def test_admin_export_entrepreneurs_csv(self, admin_token):
        r = requests.get(f"{API}/admin/export/entrepreneurs.csv",
                         headers=auth_headers(admin_token))
        assert r.status_code == 200
        assert "text/csv" in r.headers.get("content-type", "")
        assert "business_name" in r.text.splitlines()[0]

    def test_admin_export_clients_csv(self, admin_token):
        r = requests.get(f"{API}/admin/export/clients.csv",
                         headers=auth_headers(admin_token))
        assert r.status_code == 200
        assert "text/csv" in r.headers.get("content-type", "")
        assert "full_name" in r.text.splitlines()[0]

    def test_admin_export_forbidden(self, client_token):
        r = requests.get(f"{API}/admin/export/entrepreneurs.csv",
                         headers=auth_headers(client_token))
        assert r.status_code == 403
