# Auth Testing Playbook for HomeNest

Read `/app/memory/test_credentials.md` for the seeded admin credentials.

## Test credentials
- Admin: `admin@housesit.app` / `admin123`
- You may also register any new user via POST /api/auth/register

## Endpoints to test
- POST `/api/auth/register` - body `{email, password, name}` - sets cookies
- POST `/api/auth/login` - body `{email, password}` - sets cookies
- GET `/api/auth/me` - authenticated
- POST `/api/auth/logout` - clears cookies
- POST `/api/auth/google-session` - body `{session_id}` (Emergent OAuth). SKIP in automated tests unless a valid session_id is provided; expect 401 for fake inputs.

## Frontend
- Landing `/`
- `/login`, `/register` (with Google button — skip clicking Google in tests)
- `/dashboard` (auth required)
- `/forms/new`, `/forms/:formId`
- `/share/:shareToken` (public, no auth)

## How cookies are set
- JWT: `access_token` + `refresh_token` httpOnly, secure, samesite=none
- For curl: use `-c cookies.txt -b cookies.txt`
- For Playwright: rely on login POST to set cookies automatically (`credentials: 'include'` via axios.withCredentials)
