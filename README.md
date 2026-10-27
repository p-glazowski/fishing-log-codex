# LureLog

A private fishing tackle collection and catch journal, built with React, TypeScript, Express, and MongoDB. Real accounts, real persistence, private image delivery, and statistics calculated from your own catches.

## Run locally

Requires Node **22.12+** (Node 24 LTS recommended) and npm 10+. Use the committed lockfile for reproducible versions.

```bash
npm ci
cp .env.example .env
node -e "console.log(require('node:crypto').randomBytes(48).toString('hex'))"
```

Put that generated value in `JWT_SECRET` in `.env`. Never use the example value in a deployed environment. A development `.env` with a generated secret may already exist in this workspace; do not overwrite it unless you want to reset configuration.

Choose **one** MongoDB option:

```bash
# Option A: Docker Desktop must be running
# Wait for the healthcheck to initiate the single-node replica set.
docker compose up -d --wait

# Option B: no Docker required; keep this terminal open
npm run db:local
```

Option B downloads an official MongoDB binary through `mongodb-memory-server` on first use, runs a real MongoDB replica set on port 27017, and persists data in `.local/mongo`. It is a development convenience, not a production database. Do not run both options on the same port. Restart the same command to reopen your data.

In another terminal:

```bash
npm run dev
```

Open **http://localhost:5173**. The API runs on port 4000. Register an account to start with an empty collection. No Cloudinary account is needed. Vite proxies `/api` and `/media` to Express; use `localhost` consistently to match `CLIENT_ORIGIN` and cookies. For access from another device, configure `CLIENT_ORIGIN` to the exact frontend origin before starting.

### Optional sample collection

Set `SEED_EMAIL` and a unique `SEED_PASSWORD` (12+ characters, at most 72 UTF-8 bytes) in `.env`, then run:

```bash
npm run seed
```

This creates a separate Alex Fisher account with 9 realistic lures and 26 catches. Log in with the email and password you configured. The seed is idempotent: it never resets or changes an existing account. Seed records use the app’s illustrated placeholders; upload your own photos. No sample data appears in other users’ accounts.

## Commands

| Command             | Purpose                                                       |
| ------------------- | ------------------------------------------------------------- |
| `npm run dev`       | Build shared schemas, watch Express and Vite                  |
| `npm run db:local`  | Start a persistent development MongoDB replica set            |
| `npm run seed`      | Populate a dedicated sample account                           |
| `npm run typecheck` | Strict TypeScript checks across workspaces                    |
| `npm run lint`      | ESLint across the monorepo                                    |
| `npm test`          | Frontend and API integration suites                           |
| `npm run build`     | Shared declarations, server output, optimized client bundles  |
| `npm start`         | Run built Express server (serves frontend in production mode) |
| `npm run format`    | Prettier                                                      |

Integration tests start their own isolated MongoDB replica set, require no running development database, and remove their own files. First run requires network access to download MongoDB and OS permission to listen on loopback. They never connect to `MONGODB_URI` from your development `.env`.

## Features

- Registration, login, seven-day HTTP-only cookie sessions, logout, profile/avatar editing, and password changes that invalidate other sessions.
- Lure create/read/edit/delete, personal collection cards, name/brand search, brand/type/size filters, sorting, and server pagination.
- Lure details with exact all-time catch counts, species count, largest length, technical specs, notes, and recent catch history. Open the journal link for the complete paginated history.
- Multiple catches per lure, custom species, catch date/time, lengths, weights, locations, weather, water conditions, and notes.
- Photo picker, drag/drop, camera picker on supported devices, previews, loading/error feedback, and recoverable photo upload retries.
- Gallery/list journal with species search, lure/date filters, date/length/weight sorting, and catch details/editing.
- Real dashboard totals, top five lures, recent catches, monthly activity, and species breakdown.
- Public landing page, route splitting, protected routes, 404 and error boundaries, loading skeletons, useful empty states, confirmations, toasts, keyboard focus states, desktop sidebar, mobile navigation, and system-aware appearance. Theme follows device settings by default; System, Light, and Dark preferences are available only in Account settings and saved on the current browser/device.

## Interface design

The app follows the repository's [Frontend UI Engineering skill](.agents/skills/frontend-ui-engineering/SKILL.md). The [design contract](docs/design/ui-contract.md) records the visual direction, references, responsive rules, and session-aware navigation. The [verification report](docs/design/verification.md) records automated and browser checks, including accessibility checks and their boundaries.

Shared interface elements are split into focused branding, navigation, media, feedback, card, form, and dashboard components. Record forms and detail views compose those components while keeping the existing API workflows. Signed-in landing-page visitors see their profile and workspace instead of registration/sign-in actions.

## Architecture

```text
apps/client/src/
  components/       shared cards, upload UI, layout, Radix/shadcn-style primitives
  lib/              typed API client, session context
  pages/            lazy-loaded feature screens and form tests
  styles/           Tailwind CSS and responsive design tokens
apps/server/src/
  config/           validated environment
  models/           Mongoose models and ownership indexes
  middleware/       authentication, CSRF, error responses
  routes/           auth, lures, catches, dashboard, image controllers
  services/         image adapters, optimization, cleanup worker
  validators/       safe pagination/filter query parsing
  utils/            ownership and response helpers
  app.test.ts       integration coverage against MongoDB
packages/shared/    shared Zod schemas, options, and public TypeScript types
scripts/dev-db.mjs  persistent local development MongoDB launcher
```

Schemas contain no server code or secrets. Change lure types once in `packages/shared/src/index.ts`; the frontend dropdowns and backend validation use the same definition. Rebuild shared code after changes (`npm run build -w @lurelog/shared`) or restart `npm run dev`.

The UI uses React Router, TanStack Query, React Hook Form, Zod, Lucide, Motion, Recharts, Sonner, Tailwind 4, and locally owned shadcn-style Button/Radix AlertDialog components. Google Fonts is optional at runtime; local system sans-serif fallbacks keep the app usable offline.

## API

All JSON success responses use `{ "data": ... }`. List endpoints additionally return `total`, `page`, and `pages`. Deletes return 204. Failures use `{ "error": { "code": "...", "message": "...", "details": ... } }` (details only for validation).

| Method             | Route (prefix `/api/v1`)                                             |
| ------------------ | -------------------------------------------------------------------- |
| GET                | `/csrf`, `/health`                                                   |
| POST               | `/auth/register`, `/auth/login`, `/auth/logout`                      |
| GET                | `/auth/me`, `/users/me`                                              |
| PATCH              | `/auth/password`, `/users/me`                                        |
| GET, POST          | `/lures`, `/catches`                                                 |
| GET, PATCH, DELETE | `/lures/:id`, `/catches/:id`                                         |
| GET                | `/lures/:id/catches`, `/lure-filters`, `/config`, `/dashboard/stats` |
| POST multipart     | `/lures/:id/image`, `/catches/:id/photo`, `/users/me/avatar`         |

Uploads use a single multipart field named `image`. `/media/:imageId` is an authenticated, ownership-checked image endpoint outside the API prefix. It never exposes an uploads directory or Cloudinary credentials/URLs.

Lure queries: `search`, `brand`, `type`, `minSize`, `maxSize`, `sort=newest|name|catches`, `page`, `limit` (max 100).

Catch queries: `search` (species substring), `species` (exact), `lure` (ObjectId), `from` and `to` (`YYYY-MM-DD`, inclusive UTC), `sort=date|length|weight`, `page`, `limit`.

For direct API clients: obtain `/api/v1/csrf`, keep the response cookie jar, and send the returned token in `X-CSRF-Token` plus an `Origin` header matching `CLIENT_ORIGIN` for every mutation, including login and logout. The browser client handles this automatically.

## Security and data lifecycle

- BCrypt hashes (cost 12), strong password validation, no hash fields in API responses, JWT issuer/audience/algorithm checks, seven-day expiry, server-side session version revocation. Logout currently signs out all sessions for that account.
- Production session and CSRF cookies are Secure, HTTP-only, SameSite=Lax, host-prefixed and path-scoped. Mutations require exact-origin plus timing-safe double-submit CSRF checks, including pre-login requests.
- Resource IDs are validated; the authenticated session determines ownership. Client-supplied ownership/image metadata is rejected by strict schemas. All CRUD, populations, aggregations, photos, and filters are user-scoped.
- Helmet, configured-origin CORS, JSON size limits, authentication/API/upload rate limits, escaped regex search, and centralized errors. React renders user notes as text.
- Uploaded content is identified by file signatures, then actually decoded. JPEG, PNG, WebP only; maximum 5 MB input, 40 megapixels decoded. Sharp applies orientation, strips metadata, bounds resolution to 1800×1800, and writes WebP. Animated inputs become a still frame.
- Local images use random identifiers in owner directories, and are streamed only after an ownership check. Cloudinary uses **authenticated** assets; Express proxies signed delivery server-side. Browser responses use `private, no-store` to avoid retaining private images in shared caches.
- **Explicit cascade policy:** deleting a lure atomically deletes every owned catch attached to it. Image references are removed in the same MongoDB transaction and cleanup jobs are written durably. A worker retries storage deletion every 30 seconds. Replacing images and deleting catches use the same queue. No client can submit a deletion path.
- Catch writes increment the parent lure revision in the transaction, so concurrent parent deletion cannot leave orphan catches. This requires a MongoDB replica set; the included local setups configure one.

A storage write followed by a process crash before its database attachment may leave an unreferenced storage object. Compensation handles ordinary failures; production operators should periodically reconcile unreferenced storage files with database metadata. Cleanup jobs are retried indefinitely and should be monitored in production.

## Production deployment

Deploy the frontend and API on the **same HTTPS origin**. The built Express application serves `apps/client/dist`, including SPA route fallbacks; `/api` and `/media` remain backend routes.

1. Provision a MongoDB replica set (for example MongoDB Atlas), enable database authentication, and restrict network access. Never expose the unauthenticated development MongoDB container publicly.
2. Install with `npm ci`, then `npm run build`.
3. Configure `.env` (or inject environment variables and use `node apps/server/dist/server.js` directly):

   ```dotenv
   NODE_ENV=production
   PORT=4000
   CLIENT_ORIGIN=https://lurelog.example.com
   MONGODB_URI=mongodb+srv://...
   JWT_SECRET=<cryptographically random secret, 32+ characters>
   STORAGE_PROVIDER=cloudinary
   CLOUDINARY_CLOUD_NAME=...
   CLOUDINARY_API_KEY=...
   CLOUDINARY_API_SECRET=...
   ```

4. Run `npm start` from the repository root. Terminate HTTPS at exactly one trusted reverse proxy (Express trusts one proxy hop), forward client IP/protocol correctly, and block direct public access to the Node port. Set an upload request limit slightly above 5 MB for multipart overhead.
5. Ensure Cloudinary authenticated image delivery is enabled for your account. Alternatively use local storage on a persistent encrypted disk mounted at `UPLOAD_DIR`; back it up together with MongoDB. Server-relative upload paths resolve from `apps/server` under the workspace start command; an absolute production path is recommended.
6. Check `/api/v1/health`. Monitor server errors and `imagecleanups` job backlog, configure database/storage backups, and verify restore procedures. Use a process supervisor/container restart policy and graceful shutdown.

Do not put environment files or credentials in frontend variables. Native camera support depends on browser/device behavior and HTTPS. The app does not require paid services when using local storage.

For multiple Node replicas, replace in-process rate-limit storage with a shared Redis-backed store and run cleanup as a dedicated worker/leased job. The current deployment target is a single Node instance; MongoDB transactions preserve record integrity regardless.

## Verification and boundaries

The repository includes real backend integration tests for authentication, guards, lure/catch CRUD, validation, image content and size checks, image privacy, cross-user access, dashboard counts, profile/password changes, and cascade/cleanup. Frontend tests exercise login/registration validation, session synchronization, lure/catch forms, custom species, filters, async/error states, and photo validation.

Live Cloudinary requires your account credentials and must be smoke-tested in that environment. Mobile camera behavior requires a physical device. Password recovery and email verification are outside the requested scope; there is no email delivery integration. Prices intentionally use your own currency without conversion; timestamps are entered in UTC and displayed in your browser’s locale.

### Daily catch activity

On Overview, select **Explore month** under Catch activity to see the current month’s daily catch counts, including days with no catches. Use the arrows beside the centered month heading to explore other months; **Monthly view** returns to the overview. Expand **View daily catch totals** for exact counts. All activity dates use UTC.

The authenticated `GET /api/v1/dashboard/activity?month=YYYY-MM` endpoint returns `{ data: { month, total, days: [{ date, count }] } }`. Counts are scoped to the current user and bounded to that month; invalid or missing months return 422.

### Languages

LureLog supports English and Polish. Choose **Language** in Account settings, on the sign-in/registration screen, or in the public landing-page footer. The preference is saved in this browser, survives reloads, and synchronizes between tabs. It does not sync between devices. English is the default.

UI copy and known API/validation errors use the catalog in `apps/client/src/lib/i18n/pl.json`; English source strings provide the fallback. Use `useTranslation()` in components to subscribe to language changes, and `t()` for translated strings with named interpolation. Date, number, and plural helpers use the selected locale. Keep route paths, form field names, API values, and user-written names/notes untranslated. Lure category labels are translated while their API values remain canonical; common Polish fish-species names resolve to their canonical values on save, and custom species remain unchanged.

The fishing journal’s lure filter supports server-backed search and paginated results. Choices are grouped by brand without case duplicates and include model, length, and color so different versions of the same lure remain distinguishable. Selecting **All lures** clears the filter.

### Testing on an iPhone over Wi-Fi

Keep your phone and Mac on the same Wi-Fi. Set `CLIENT_ORIGIN=http://<your-Mac-LAN-IP>:5173` in the root `.env`, restart `npm run dev`, and open that URL in Safari on your phone. Keep MongoDB running. Development also trusts `localhost` and `127.0.0.1` on the configured frontend port, so the Mac and phone can use their respective addresses. CORS and CSRF share this exact allowlist, and CSRF tokens are still required. Production trusts only the configured origin.
