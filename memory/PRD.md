# HomeNest — Product Requirements

## Original Problem Statement
Website where house-sitters sign up, set up a house-sitting form, and share it with clients they're sitting for. Form structure (per original spec):
- Page 1: Calendar for out-of-town dates
- Page 2: Stay/Bed requirements
- Page 3: Pet list and names
- Page 4: Feeding schedule, walk frequency
- Page 5: Other tasks (watering plants, mowing lawn)
- Page 6: Contact info, emergency contacts, water shut-off, Wi-Fi, **mandatory vet info** (moved here per latest user request)

Client progress saved locally; dynamic pricing calculates total cost from form inputs and sitter pricing settings.

## Personas
- **Sitter**: Registers, configures pricing & profile, generates share links, receives completed care plans.
- **Client (homeowner)**: Receives a share link, sees the sitter's intro, fills the 6-step form, submits.

## Core Architecture
- Backend: FastAPI (`/app/backend/server.py`) + MongoDB
- Frontend: React + Tailwind + Shadcn UI
- Auth: JWT cookies + Emergent Google OAuth
- Email: Resend (optional via `RESEND_API_KEY`)
- Beta tracking: BetaPool SDK (`visited_site` milestone)

## Implemented (Changelog)
### 2026-02 (this fork)
- Fixed backend `SyntaxError` (stray text after CORS middleware).
- Fixed frontend `ProfileSettings.jsx` corrupted/duplicated `Field` component.
- Added `same_vet_for_all` + `vet_shared` to `FormSubmitIn` model so vet data persists end-to-end.
- Replaced URL-only profile picture input with **file upload** (client-side base64 resize via `lib/image.js`); backend already capped data-URLs at 1.5 MB.
- **Moved Vet Info from Step 4 (Care) to Step 6 (Contacts)** per user request — vet section now lives at the end of the form, alongside emergency contacts and water shut-off. Step 4 retitled "Feeding & walks". `canNext()` updated.

### Earlier (prior forks)
- Sitter dynamic pricing (price-per-day, per-pet, sleepover, Wi-Fi discount).
- Public-form local-storage drafts (`homenest:fill:<token>`).
- Sitter profile embedded into public-form intro.
- Mandatory contact validation (owner name/phone, water shut-off, ≥1 emergency contact).
- DatePicker timezone fix.
- BetaPool `visited_site` milestone.

## Backlog / Roadmap
- **P1**: Refactor `FormSteps.jsx` (now ~830 lines) — extract `StepCare`, `StepContacts`, `VetFields` into separate files.
- **P2**: PDF export of the final Care Plan.
- **P2**: Sitter analytics — form views, completion rate.
- **P2**: Add `EmailStr` validator on `FormCreateIn.client_email`.
- **P3**: Auth-protect `POST /api/auth/logout` (currently always 200).

## Test Credentials
See `/app/memory/test_credentials.md`.

## API
- `POST /api/auth/register|login|logout`, `GET /api/auth/me`, `POST /api/auth/google-session`
- `GET|PUT /api/me/pricing`, `GET|PUT /api/me/profile`
- `POST|GET|PUT|DELETE /api/forms[/{id}]`
- `GET /api/public/forms/{share_token}` (public)
- `POST /api/public/forms/{share_token}/submit` (public; now accepts `same_vet_for_all` + `vet_shared`)
- `POST /api/forms/{form_id}/send-email` (Resend)
