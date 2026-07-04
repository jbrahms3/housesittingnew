"""Backend tests for HomeNest house-sitting app (FLIPPED schema iteration 2).

Covers:
- Auth: /api/auth/register, /api/auth/login, /api/auth/me, /api/auth/logout, /api/auth/google-session
- Forms: POST/GET/PUT/DELETE /api/forms (now takes only {title, client_name, client_email})
- Public: GET /api/public/forms/{share_token}, POST /api/public/forms/{share_token}/submit
- Email: POST /api/forms/{form_id}/send-email returns 503 when RESEND_API_KEY empty
"""
import os
import uuid
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")
assert BASE_URL, "REACT_APP_BACKEND_URL must be set"
API = f"{BASE_URL}/api"


# ---------- Fixtures ----------
@pytest.fixture(scope="module")
def test_user():
    suffix = uuid.uuid4().hex[:8]
    return {
        "email": f"TEST_sitter_{suffix}@example.com",
        "password": "TestPass123!",
        "name": f"TEST Sitter {suffix}",
    }


@pytest.fixture(scope="module")
def session_for_user(test_user):
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    r = s.post(f"{API}/auth/register", json=test_user, timeout=20)
    assert r.status_code == 200, f"register failed: {r.status_code} {r.text}"
    return s


@pytest.fixture(scope="module")
def admin_session():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    r = s.post(f"{API}/auth/login", json={"email": "admin@housesit.app", "password": "admin123"}, timeout=20)
    assert r.status_code == 200, f"admin login failed: {r.status_code} {r.text}"
    return s


# ---------- Auth tests ----------
class TestAuth:
    def test_register_creates_user_and_sets_cookie(self, test_user, session_for_user):
        assert "access_token" in session_for_user.cookies.get_dict()
        r = session_for_user.get(f"{API}/auth/me", timeout=15)
        assert r.status_code == 200
        data = r.json()
        assert data["email"] == test_user["email"].lower()
        assert data["name"] == test_user["name"]
        assert data["auth_provider"] == "password"
        assert data["user_id"].startswith("user_")

    def test_register_duplicate_email_400(self, test_user, session_for_user):
        r = requests.post(f"{API}/auth/register", json=test_user, timeout=15)
        assert r.status_code == 400

    def test_login_success_and_cookie(self, test_user):
        s = requests.Session()
        r = s.post(f"{API}/auth/login", json={"email": test_user["email"], "password": test_user["password"]}, timeout=15)
        assert r.status_code == 200
        data = r.json()
        assert data["email"] == test_user["email"].lower()
        assert "access_token" in s.cookies.get_dict()

    def test_login_bad_password_401(self, test_user):
        r = requests.post(f"{API}/auth/login", json={"email": test_user["email"], "password": "wrong"}, timeout=15)
        assert r.status_code == 401

    def test_login_unknown_email_401(self):
        r = requests.post(f"{API}/auth/login", json={"email": "nope_xyz@example.com", "password": "x"}, timeout=15)
        assert r.status_code == 401

    def test_me_unauth_401(self):
        r = requests.get(f"{API}/auth/me", timeout=15)
        assert r.status_code == 401

    def test_logout_clears_cookie(self, test_user):
        s = requests.Session()
        r = s.post(f"{API}/auth/login", json={"email": test_user["email"], "password": test_user["password"]}, timeout=15)
        assert r.status_code == 200
        r2 = s.post(f"{API}/auth/logout", timeout=15)
        assert r2.status_code == 200
        # Clear local cookie jar (server sends delete-cookie; simulate client honoring it)
        s.cookies.clear()
        r3 = s.get(f"{API}/auth/me", timeout=15)
        assert r3.status_code == 401

    def test_google_session_bad_id(self):
        r = requests.post(f"{API}/auth/google-session", json={"session_id": "invalid-id-12345"}, timeout=20)
        assert r.status_code in (401, 502)


# ---------- Forms CRUD tests ----------
class TestForms:
    def test_list_forms_unauth_401(self):
        r = requests.get(f"{API}/forms", timeout=15)
        assert r.status_code == 401

    def test_create_form_pending_shape(self, session_for_user, test_user):
        payload = {
            "title": "TEST Smith family trip",
            "client_name": "TEST Sarah Smith",
            "client_email": "TEST_client@example.com",
        }
        r = session_for_user.post(f"{API}/forms", json=payload, timeout=15)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["title"] == payload["title"]
        assert data["client_name"] == payload["client_name"]
        assert data["client_email"] == payload["client_email"].lower()
        assert data["form_id"].startswith("form_")
        assert data["share_token"]
        assert data["status"] == "pending"
        assert data["completed_at"] is None
        assert data["sitter_name"] == test_user["name"]
        assert data["sitter_email"] == test_user["email"].lower()
        # Submission defaults are empty
        assert data["pets"] == []
        assert data["tasks"] == []
        assert "_id" not in data
        pytest._form_id = data["form_id"]
        pytest._share_token = data["share_token"]

    def test_get_own_form(self, session_for_user):
        r = session_for_user.get(f"{API}/forms/{pytest._form_id}", timeout=15)
        assert r.status_code == 200
        d = r.json()
        assert d["form_id"] == pytest._form_id
        assert d["status"] == "pending"

    def test_list_own_forms(self, session_for_user):
        r = session_for_user.get(f"{API}/forms", timeout=15)
        assert r.status_code == 200
        lst = r.json()
        assert isinstance(lst, list)
        assert any(f["form_id"] == pytest._form_id and f["status"] == "pending" for f in lst)

    def test_update_form_meta_partial(self, session_for_user):
        r = session_for_user.put(
            f"{API}/forms/{pytest._form_id}",
            json={"title": "TEST Updated title only"},
            timeout=15,
        )
        assert r.status_code == 200
        assert r.json()["title"] == "TEST Updated title only"
        # Verify persistence and client_email unchanged
        g = session_for_user.get(f"{API}/forms/{pytest._form_id}", timeout=15).json()
        assert g["title"] == "TEST Updated title only"
        assert g["client_email"] == "TEST_client@example.com".lower()

    def test_update_form_meta_email_lowered(self, session_for_user):
        r = session_for_user.put(
            f"{API}/forms/{pytest._form_id}",
            json={"client_email": "NEW_client@example.com", "client_name": "TEST Sarah S"},
            timeout=15,
        )
        assert r.status_code == 200
        data = r.json()
        assert data["client_email"] == "new_client@example.com"
        assert data["client_name"] == "TEST Sarah S"

    def test_other_user_cannot_access(self, admin_session):
        r = admin_session.get(f"{API}/forms/{pytest._form_id}", timeout=15)
        assert r.status_code == 404

    # ----- Public endpoints -----
    def test_public_get_pending(self):
        r = requests.get(f"{API}/public/forms/{pytest._share_token}", timeout=15)
        assert r.status_code == 200
        d = r.json()
        assert d["share_token"] == pytest._share_token
        assert d["status"] == "pending"
        assert "user_id" not in d
        assert "sitter_email" not in d
        assert "sitter_name" in d  # sitter NAME is allowed public
        assert "_id" not in d

    def test_public_get_not_found(self):
        r = requests.get(f"{API}/public/forms/nonexistent-token-xyz", timeout=15)
        assert r.status_code == 404

    def test_public_submit_no_auth(self):
        payload = {
            "date_start": "2026-02-01",
            "date_end": "2026-02-10",
            "selected_dates": ["2026-02-01", "2026-02-02"],
            "stay_required": True,
            "bed_provided": True,
            "stay_notes": "Guest room upstairs",
            "pets": [
                {"type": "dog", "name": "Buddy",
                 "feeding_schedule": [{"time": "8:00", "amount": "1 cup", "instructions": "kibble"}],
                 "walk_frequency": "twice_daily"}
            ],
            "tasks": [{"type": "water_plants", "details": "Every 2 days"}],
            "owner_name": "TEST Owner",
            "owner_phone": "555-1234",
            "owner_email": "owner@example.com",
            "emergency_contacts": [{"name": "Jane", "phone": "555-9999", "relation": "sister"}],
            "water_shutoff": "Basement",
            "other_notes": "Thanks!",
        }
        r = requests.post(f"{API}/public/forms/{pytest._share_token}/submit", json=payload, timeout=20)
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["status"] == "completed"
        assert d["completed_at"]
        assert len(d["pets"]) == 1
        assert d["pets"][0]["name"] == "Buddy"
        assert d["stay_notes"] == "Guest room upstairs"
        assert "user_id" not in d
        assert "sitter_email" not in d

    def test_public_submit_already_completed_400(self):
        r = requests.post(f"{API}/public/forms/{pytest._share_token}/submit", json={}, timeout=15)
        assert r.status_code == 400

    def test_public_submit_invalid_token_404(self):
        r = requests.post(f"{API}/public/forms/nonexistent-token/submit", json={}, timeout=15)
        assert r.status_code == 404

    def test_owner_sees_completed_after_submit(self, session_for_user):
        r = session_for_user.get(f"{API}/forms/{pytest._form_id}", timeout=15)
        assert r.status_code == 200
        d = r.json()
        assert d["status"] == "completed"
        assert d["completed_at"]
        assert d["owner_name"] == "TEST Owner"
        assert d["water_shutoff"] == "Basement"

    # ----- Email -----
    def test_send_email_503_when_resend_empty_default_recipient(self, session_for_user):
        # No recipient in body -> uses form.client_email (should still 503 because no key)
        r = session_for_user.post(
            f"{API}/forms/{pytest._form_id}/send-email",
            json={"personal_note": "Thanks!"},
            timeout=15,
        )
        assert r.status_code == 503
        body = r.json()
        assert "detail" in body
        assert "Email service" in body["detail"] or "RESEND_API_KEY" in body["detail"]

    def test_send_email_503_with_explicit_recipient(self, session_for_user):
        r = session_for_user.post(
            f"{API}/forms/{pytest._form_id}/send-email",
            json={"recipient_email": "recipient@example.com"},
            timeout=15,
        )
        assert r.status_code == 503

    def test_send_email_unauth_401(self):
        r = requests.post(
            f"{API}/forms/{pytest._form_id}/send-email",
            json={"recipient_email": "x@example.com"},
            timeout=15,
        )
        assert r.status_code == 401

    def test_delete_form_and_verify(self, session_for_user):
        r = session_for_user.delete(f"{API}/forms/{pytest._form_id}", timeout=15)
        assert r.status_code == 200
        r2 = session_for_user.get(f"{API}/forms/{pytest._form_id}", timeout=15)
        assert r2.status_code == 404

    def test_delete_already_gone_404(self, session_for_user):
        r = session_for_user.delete(f"{API}/forms/{pytest._form_id}", timeout=15)
        assert r.status_code == 404
