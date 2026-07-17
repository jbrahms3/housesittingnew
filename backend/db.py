import json
from datetime import datetime
from typing import Any, Dict, List, Optional

import asyncpg

SCHEMA = """
CREATE TABLE IF NOT EXISTS users (
    user_id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    username TEXT UNIQUE,
    name TEXT,
    password_hash TEXT,
    auth_provider TEXT,
    picture TEXT,
    bio TEXT,
    phone TEXT,
    location TEXT,
    languages TEXT,
    years_experience INT,
    certifications TEXT,
    verified_sits INT DEFAULT 0,
    created_at TEXT,
    services JSONB,
    pricing JSONB
);

CREATE TABLE IF NOT EXISTS forms (
    form_id TEXT PRIMARY KEY,
    user_id TEXT REFERENCES users(user_id),
    share_token TEXT UNIQUE NOT NULL,
    sitter_name TEXT,
    sitter_email TEXT,
    title TEXT,
    client_name TEXT,
    client_email TEXT,
    status TEXT,
    date_start TEXT,
    date_end TEXT,
    home_address TEXT,
    stay_notes TEXT,
    owner_name TEXT,
    owner_phone TEXT,
    owner_email TEXT,
    water_shutoff TEXT,
    wifi_password TEXT,
    guests_notes TEXT,
    other_notes TEXT,
    stay_required BOOLEAN,
    bed_provided BOOLEAN,
    same_vet_for_all BOOLEAN,
    wifi_shared BOOLEAN,
    guests_allowed BOOLEAN,
    sitter_confirmed BOOLEAN DEFAULT FALSE,
    zip_code TEXT,
    details_completed BOOLEAN DEFAULT FALSE,
    max_hours_away DOUBLE PRECISION,
    created_at TEXT,
    updated_at TEXT,
    completed_at TEXT,
    confirmed_at TEXT,
    details_completed_at TEXT,
    selected_dates JSONB,
    pets JSONB,
    tasks JSONB,
    emergency_contacts JSONB,
    vet_shared JSONB
);

CREATE INDEX IF NOT EXISTS forms_user_id_idx ON forms(user_id);

-- Idempotent add for the two-stage intake columns (in case the table predates them).
ALTER TABLE forms ADD COLUMN IF NOT EXISTS zip_code TEXT;
ALTER TABLE forms ADD COLUMN IF NOT EXISTS details_completed BOOLEAN DEFAULT FALSE;
ALTER TABLE forms ADD COLUMN IF NOT EXISTS details_completed_at TEXT;
ALTER TABLE forms ADD COLUMN IF NOT EXISTS max_hours_away DOUBLE PRECISION;
"""

USER_COLUMNS = [
    "user_id", "email", "username", "name", "password_hash", "auth_provider",
    "picture", "bio", "phone", "location", "languages", "years_experience",
    "certifications", "verified_sits", "created_at", "services", "pricing",
]

FORM_COLUMNS = [
    "form_id", "user_id", "share_token", "sitter_name", "sitter_email", "title",
    "client_name", "client_email", "status", "date_start", "date_end",
    "home_address", "stay_notes", "owner_name", "owner_phone", "owner_email",
    "water_shutoff", "wifi_password", "guests_notes", "other_notes",
    "stay_required", "bed_provided", "same_vet_for_all", "wifi_shared",
    "guests_allowed", "sitter_confirmed", "zip_code", "details_completed",
    "max_hours_away", "created_at", "updated_at", "completed_at", "confirmed_at",
    "details_completed_at", "selected_dates", "pets", "tasks",
    "emergency_contacts", "vet_shared",
]

_JSON_FIELDS = {"services", "pricing", "selected_dates", "pets", "tasks", "emergency_contacts", "vet_shared"}


def _dump(field: str, value: Any) -> Any:
    if field in _JSON_FIELDS and value is not None:
        return json.dumps(value)
    return value


def _row_to_dict(row: Optional[asyncpg.Record]) -> Optional[Dict[str, Any]]:
    if row is None:
        return None
    doc = dict(row)
    for key, value in doc.items():
        if isinstance(value, datetime):
            doc[key] = value.isoformat()
        elif key in _JSON_FIELDS and isinstance(value, str):
            doc[key] = json.loads(value)
    return doc


class Database:
    def __init__(self, dsn: str):
        self.dsn = dsn
        self.pool: Optional[asyncpg.Pool] = None

    async def connect(self):
        self.pool = await asyncpg.create_pool(dsn=self.dsn)
        async with self.pool.acquire() as conn:
            await conn.execute(SCHEMA)

    async def close(self):
        if self.pool:
            await self.pool.close()

    # ---------------- users ----------------
    async def get_user_by_email(self, email: str) -> Optional[Dict[str, Any]]:
        async with self.pool.acquire() as conn:
            row = await conn.fetchrow("SELECT * FROM users WHERE email = $1", email)
        return _row_to_dict(row)

    async def get_user_by_id(self, user_id: str) -> Optional[Dict[str, Any]]:
        async with self.pool.acquire() as conn:
            row = await conn.fetchrow("SELECT * FROM users WHERE user_id = $1", user_id)
        return _row_to_dict(row)

    async def insert_user(self, doc: Dict[str, Any]):
        cols = [c for c in USER_COLUMNS if c in doc]
        placeholders = ", ".join(f"${i + 1}" for i in range(len(cols)))
        values = [_dump(c, doc.get(c)) for c in cols]
        query = f"INSERT INTO users ({', '.join(cols)}) VALUES ({placeholders})"
        async with self.pool.acquire() as conn:
            await conn.execute(query, *values)

    async def update_user(self, user_id: str, patch: Dict[str, Any]):
        cols = [c for c in USER_COLUMNS if c in patch and c != "user_id"]
        if not cols:
            return
        set_clause = ", ".join(f"{c} = ${i + 1}" for i, c in enumerate(cols))
        values = [_dump(c, patch.get(c)) for c in cols]
        query = f"UPDATE users SET {set_clause} WHERE user_id = ${len(cols) + 1}"
        async with self.pool.acquire() as conn:
            await conn.execute(query, *values, user_id)

    # ---------------- forms ----------------
    async def insert_form(self, doc: Dict[str, Any]):
        cols = [c for c in FORM_COLUMNS if c in doc]
        placeholders = ", ".join(f"${i + 1}" for i in range(len(cols)))
        values = [_dump(c, doc.get(c)) for c in cols]
        query = f"INSERT INTO forms ({', '.join(cols)}) VALUES ({placeholders})"
        async with self.pool.acquire() as conn:
            await conn.execute(query, *values)

    async def get_form(self, form_id: str, user_id: Optional[str] = None) -> Optional[Dict[str, Any]]:
        async with self.pool.acquire() as conn:
            if user_id is not None:
                row = await conn.fetchrow(
                    "SELECT * FROM forms WHERE form_id = $1 AND user_id = $2", form_id, user_id
                )
            else:
                row = await conn.fetchrow("SELECT * FROM forms WHERE form_id = $1", form_id)
        return _row_to_dict(row)

    async def get_form_by_share_token(self, share_token: str) -> Optional[Dict[str, Any]]:
        async with self.pool.acquire() as conn:
            row = await conn.fetchrow("SELECT * FROM forms WHERE share_token = $1", share_token)
        return _row_to_dict(row)

    async def list_forms_by_user(self, user_id: str) -> List[Dict[str, Any]]:
        async with self.pool.acquire() as conn:
            rows = await conn.fetch(
                "SELECT * FROM forms WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1000", user_id
            )
        return [_row_to_dict(r) for r in rows]

    async def list_confirmed_forms(self, user_id: str, exclude_form_id: Optional[str] = None) -> List[Dict[str, Any]]:
        async with self.pool.acquire() as conn:
            if exclude_form_id is not None:
                rows = await conn.fetch(
                    "SELECT * FROM forms WHERE user_id = $1 AND sitter_confirmed = TRUE AND form_id != $2",
                    user_id, exclude_form_id,
                )
            else:
                rows = await conn.fetch(
                    "SELECT * FROM forms WHERE user_id = $1 AND sitter_confirmed = TRUE", user_id
                )
        return [_row_to_dict(r) for r in rows]

    async def update_form(self, form_id: str, patch: Dict[str, Any], user_id: Optional[str] = None):
        cols = [c for c in FORM_COLUMNS if c in patch and c != "form_id"]
        if not cols:
            return
        set_clause = ", ".join(f"{c} = ${i + 1}" for i, c in enumerate(cols))
        values = [_dump(c, patch.get(c)) for c in cols]
        if user_id is not None:
            query = f"UPDATE forms SET {set_clause} WHERE form_id = ${len(cols) + 1} AND user_id = ${len(cols) + 2}"
            values.extend([form_id, user_id])
        else:
            query = f"UPDATE forms SET {set_clause} WHERE form_id = ${len(cols) + 1}"
            values.append(form_id)
        async with self.pool.acquire() as conn:
            await conn.execute(query, *values)

    async def update_form_by_share_token(self, share_token: str, patch: Dict[str, Any]):
        cols = [c for c in FORM_COLUMNS if c in patch]
        if not cols:
            return
        set_clause = ", ".join(f"{c} = ${i + 1}" for i, c in enumerate(cols))
        values = [_dump(c, patch.get(c)) for c in cols]
        query = f"UPDATE forms SET {set_clause} WHERE share_token = ${len(cols) + 1}"
        async with self.pool.acquire() as conn:
            await conn.execute(query, *values, share_token)

    async def delete_form(self, form_id: str, user_id: str) -> bool:
        async with self.pool.acquire() as conn:
            result = await conn.execute(
                "DELETE FROM forms WHERE form_id = $1 AND user_id = $2", form_id, user_id
            )
        return result != "DELETE 0"
