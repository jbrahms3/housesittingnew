"""Tests for iteration 3 features:
- FormSubmitIn accepts/persists same_vet_for_all + vet_shared (+ per-pet vet)
- PUT /api/me/profile accepts base64 data URL in `picture` (with size cap)
"""
import os
import uuid
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")
assert BASE_URL, "REACT_APP_BACKEND_URL must be set"
API = f"{BASE_URL}/api"


@pytest.fixture(scope="module")
def sitter_session():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    suffix = uuid.uuid4().hex[:8]
    user = {
        "email": f"TEST_vetsitter_{suffix}@example.com",
        "password": "TestPass123!",
        "name": f"TEST VetSitter {suffix}",
    }
    r = s.post(f"{API}/auth/register", json=user, timeout=20)
    assert r.status_code == 200, r.text
    s._user = user
    return s


def _create_form(session) -> dict:
    r = session.post(f"{API}/forms", json={
        "title": "TEST vet flow",
        "client_name": "TEST Client",
        "client_email": "TEST_vetclient@example.com",
    }, timeout=15)
    assert r.status_code == 200, r.text
    return r.json()


# ---------- Shared vet (same_vet_for_all=True) ----------
class TestSharedVet:
    def test_submit_with_shared_vet_persists(self, sitter_session):
        form = _create_form(sitter_session)
        token = form["share_token"]
        payload = {
            "date_start": "2026-03-01",
            "date_end": "2026-03-05",
            "selected_dates": ["2026-03-01", "2026-03-02"],
            "pets": [
                {"type": "dog", "name": "Rex"},
                {"type": "cat", "name": "Whiskers"},
            ],
            "same_vet_for_all": True,
            "vet_shared": {
                "name": "Dr. Shared",
                "phone": "555-0001",
                "address": "123 Vet St",
                "notes": "Open 24/7",
            },
            "owner_name": "TEST Owner",
            "owner_phone": "555-1234",
            "emergency_contacts": [{"name": "Jane", "phone": "555-9999", "relation": "friend"}],
            "water_shutoff": "Basement",
        }
        r = requests.post(f"{API}/public/forms/{token}/submit", json=payload, timeout=20)
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["same_vet_for_all"] is True
        assert d["vet_shared"]["name"] == "Dr. Shared"
        assert d["vet_shared"]["phone"] == "555-0001"
        assert d["vet_shared"]["address"] == "123 Vet St"
        assert d["vet_shared"]["notes"] == "Open 24/7"
        assert d["status"] == "completed"

        # Sitter view also persists these
        g = sitter_session.get(f"{API}/forms/{form['form_id']}", timeout=15).json()
        assert g["same_vet_for_all"] is True
        assert g["vet_shared"]["name"] == "Dr. Shared"
        # Public view (read-only) preserves them
        pub = requests.get(f"{API}/public/forms/{token}", timeout=15).json()
        assert pub["same_vet_for_all"] is True
        assert pub["vet_shared"]["phone"] == "555-0001"


# ---------- Per-pet vet (same_vet_for_all=False) ----------
class TestPerPetVet:
    def test_submit_with_per_pet_vet_persists(self, sitter_session):
        form = _create_form(sitter_session)
        token = form["share_token"]
        payload = {
            "date_start": "2026-04-01",
            "date_end": "2026-04-05",
            "pets": [
                {"type": "dog", "name": "Rex",
                 "vet": {"name": "Dog Doc", "phone": "555-1111", "address": "", "notes": ""}},
                {"type": "cat", "name": "Whiskers",
                 "vet": {"name": "Cat Doc", "phone": "555-2222", "address": "45 Feline Ln", "notes": "allergic to X"}},
            ],
            "same_vet_for_all": False,
            "vet_shared": None,
            "owner_name": "TEST Owner",
            "owner_phone": "555-1234",
            "emergency_contacts": [{"name": "Jane", "phone": "555-9999", "relation": "friend"}],
            "water_shutoff": "Basement",
        }
        r = requests.post(f"{API}/public/forms/{token}/submit", json=payload, timeout=20)
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["same_vet_for_all"] is False
        assert d["pets"][0]["vet"]["name"] == "Dog Doc"
        assert d["pets"][0]["vet"]["phone"] == "555-1111"
        assert d["pets"][1]["vet"]["name"] == "Cat Doc"
        assert d["pets"][1]["vet"]["address"] == "45 Feline Ln"

        # Persistence check
        g = sitter_session.get(f"{API}/forms/{form['form_id']}", timeout=15).json()
        assert g["pets"][0]["vet"]["name"] == "Dog Doc"
        assert g["pets"][1]["vet"]["phone"] == "555-2222"


# ---------- Profile base64 picture ----------
# 1x1 red JPEG base64 (valid data URL)
TINY_JPEG_B64 = (
    "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0a"
    "HBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIy"
    "MjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcI"
    "CQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0"
    "NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLD"
    "xMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/9oACAEBAAA/APf6KKKKKK//2Q=="
)


class TestProfilePicture:
    def test_put_profile_accepts_base64_data_url(self, sitter_session):
        r = sitter_session.put(f"{API}/me/profile", json={"picture": TINY_JPEG_B64}, timeout=15)
        assert r.status_code == 200, r.text
        assert r.json()["picture"] == TINY_JPEG_B64

        # Persistence
        g = sitter_session.get(f"{API}/me/profile", timeout=15).json()
        assert g["picture"] == TINY_JPEG_B64

    def test_put_profile_rejects_oversized_data_url(self, sitter_session):
        # > 1_500_000 bytes post-base64
        oversize = "data:image/jpeg;base64," + ("A" * 1_500_001)
        r = sitter_session.put(f"{API}/me/profile", json={"picture": oversize}, timeout=20)
        assert r.status_code == 413

    def test_put_profile_accepts_http_url(self, sitter_session):
        r = sitter_session.put(f"{API}/me/profile", json={"picture": "https://example.com/p.jpg"}, timeout=15)
        assert r.status_code == 200
        assert r.json()["picture"] == "https://example.com/p.jpg"

    def test_put_profile_unauth_401(self):
        r = requests.put(f"{API}/me/profile", json={"picture": TINY_JPEG_B64}, timeout=15)
        assert r.status_code == 401
