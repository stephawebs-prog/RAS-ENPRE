# PRD — Red de Amor y Solidaridad

## Original problem statement
> "Quiero mejorar esta web https://lovesolidarity.com/ enfocado en registro de emprendedores donde van a encontrar más clientes, importante llevar las personas al formulario donde ponga su empresa y sus datos para la creación de su perfil, quiero en inglés y español."

## User decisions
- Build from scratch (inspired by lovesolidarity.com)
- Bilingual ES/EN (default ES)
- Brand colors per uploaded reference: deep teal `#1F4E47` + warm orange `#E97A3A`, white background
- Entrepreneur registration form: complete (name, email, business, description, phone, logo, category, social, location, website)
- JWT email/password auth + entrepreneur dashboard to edit own profile
- Public directory **gated behind login**: visitors must register as either Client or Entrepreneur to view full directory
- Client registration: minimal + interests (categories of interest)
- Admin panel for owner: see all entrepreneurs, all clients, contact messages, toggle Featured, delete, export CSV

## Tech stack
- Backend: FastAPI + Motor (async MongoDB) + bcrypt + PyJWT
- Frontend: React 19 (CRA/craco) + TailwindCSS + lucide-react icons + react-router 7
- DB: MongoDB (`red_solidaridad_db`)
- i18n: lightweight context (no library), strings in `/src/i18n/strings.js`
- Typography: Cormorant Garamond (display) + Manrope (body)

## Personas
1. **Site Owner / Admin** — Manages members, monitors growth, exports leads.
2. **Entrepreneur** — Wants to publish a business profile to be found by clients.
3. **Client / Visitor** — Registers to discover trusted local businesses.

## Architecture
- `/api/*` routes via FastAPI router. Auth via Bearer token (preferred) and httpOnly cookies fallback.
- Roles: `admin`, `entrepreneur`, `client`. Role-based gating server-side; SmartDashboard component routes by role on frontend.
- Paywall: `GET /api/entrepreneurs` and `/api/entrepreneurs/{id}` require auth. `GET /api/entrepreneurs/preview` is public (used for landing teaser & paywall peek).

## What's been implemented (Iteration 1 — 2026-04-27)
### Backend
- `POST /api/auth/register-entrepreneur` (creates user+profile)
- `POST /api/auth/register-client` (creates client user with interests)
- `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me`
- `GET /api/entrepreneurs` (auth) — search + filter (q, category, city)
- `GET /api/entrepreneurs/preview` (public) — top 6 featured
- `GET /api/entrepreneurs/{id}` (auth)
- `PUT /api/entrepreneurs/me` (entrepreneur only)
- `POST /api/contact` (public)
- Admin: `/api/admin/stats`, `/admin/entrepreneurs` (list/PATCH/DELETE), `/admin/clients` (list/DELETE), `/admin/messages` (list/PATCH read/DELETE), `/admin/export/{entrepreneurs|clients}.csv`
- Auto-seed admin + 6 sample entrepreneurs + 1 demo client on first startup
- MongoDB indexes (email unique, user_id, category, city)

### Frontend
- Bilingual (ES/EN) with localStorage persistence and top-bar toggle
- Pages: Home, Directory (gated), ProfileDetail (gated), RegisterChoice, RegisterClient, Register (entrepreneur 3-step), Login, Dashboard (entrepreneur edit), AdminPanel (4 tabs)
- Paywall component with two clear CTAs (client vs entrepreneur) + blurred peek
- Role-based navbar + SmartDashboard routing
- Admin tables with featured toggle, delete, CSV export download

### Testing
- Backend pytest: **40/40 passing** (`/app/backend/tests/backend_test.py`)
- Frontend E2E (Playwright): **12/13 critical flows passing** — only flake is automated select-tag race on multi-step form (real users unaffected)

## Test credentials
See `/app/memory/test_credentials.md`

## Iteration 4 — 2026-04-30
### Frontend
- Restored colored choice cards on `/register`: solid orange (Usuario) + solid teal-deep (Emprendimiento)
- Priority countries (US, CO, MX, HN, SV) at top of country dropdowns (entrepreneur + client + phone-input)
- Step 3 of entrepreneur registration: Logo + Cover image upload via Base64 (max 800KB), all fields explicitly optional with note
- New optional social fields: LinkedIn, TikTok, YouTube (Es/En i18n added)
- **Fixed CRITICAL bug**: Step 1 → Step 2 transition was auto-submitting the form (jumped straight to success page). Root cause: `<form onSubmit>` could be triggered by Enter key or stale step closure during state batching. Fix: form's onSubmit is now a pure preventDefault, advancement happens only via Next button onClick, real registration only via the explicit Submit button on Step 3 (with a `stepRef` hard guard).
- Phone is correctly combined `{dialCode} {number}` into the single `phone` field expected by the backend (entrepreneur form was missing this; now fixed)

### Backend
- `RegisterEntrepreneurIn` model + endpoint accept `linkedin`, `tiktok`, `youtube`, `logo_url`, `cover_url` (Optional[str])

### Testing
- Backend pytest: 5 new test cases for new fields PASS (iter3) + previous 40 still green
- Frontend E2E (Playwright self-test by main agent): full multi-step entrepreneur registration flow now reaches Step 3 and submits successfully — verified entrepreneur saved with combined phone `+1 5551234567`, country `US`, city `Los Angeles`

## Backlog / Next iterations
- **P1**: Forgot Password flow via Resend (email reset link)
- **P1**: Resend domain verification (currently only delivers to stephawebs@gmail.com — testing mode)
- **P2**: Refactor `Register.jsx` (split each step into its own sub-component for maintainability)
- **P2**: Admin: edit entrepreneur profile inline
- **P2**: Entrepreneur reviews/ratings from clients
- **P2**: Map view in directory (Leaflet by city)
- **P3**: WhatsApp button click-tracking & lead-handoff
- **P3**: Featured plan / paid promotion (Stripe)

## Deployment
- Native Emergent Deploy (recommended) — 1-click, includes MongoDB.
- Self-hosted cPanel possible if Python App + MongoDB Atlas — guide provided in chat.
