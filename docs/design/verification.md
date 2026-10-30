# UI redesign verification

Verified on 26 October 2026, on `feature/main-page`.

## Automated checks

- `npm run lint`: passed.
- `npm run typecheck`: passed across client, server, and shared schemas.
- `npm run build`: passed for the complete monorepo.
- `npm test`: 55 passing tests (41 frontend, 14 MongoDB/API integration).
- Axe structural audits cover signed-in/signed-out landing pages, login, registration, collection, journal, both record forms, both detail views, and profile settings.
- Existing regressions remain covered: authentication, forms, search/filtering, deleted lure selection, catch/lure deletion and redirects, photo validation, ownership and cross-user prevention, and transactional deletion.
- Session navigation tests explicitly cover guest, authenticated, loading, and failed-session states. Signed-in visitors have no login/registration links or CTAs on the landing page.

## Rendered browser checks

Checked landing, dashboard, collection, journal, add lure, log catch, profile, and real lure/catch detail records at **320, 768, 1024, and 1440 CSS pixels** (36 page/width checks). All fit without document-level horizontal overflow. Primary screens have one page heading. Mobile catch forms use full-width fields.

Light/dark review covered the primary screens. Rendered text and input-placeholder colors were checked against 4.5:1 for normal text and 3:1 for large text, with no failures in those samples. Axe's contrast rule is disabled in jsdom because it cannot measure browser layout; the rendered browser review supplies the separate contrast check. These checks are a development quality gate, not a claim of formal accessibility certification.

The mobile navigation was operated with the keyboard: opening moves focus into the native modal dialog, Tab stays inside, Escape closes it, and focus returns to the opener. Lure picker keyboard, retry, stale-record and pagination behavior is retained by its regression tests. Uploaded image/camera pickers now both have native keyboard-accessible buttons.

Verified the signed-in landing page displays the actual account name/avatar instead of sign-in/register links; clicking it opens `/profile`. Workspace links point to `/dashboard`; catch and collection CTAs retain their actual routes. Dashboard values and journal records come from the existing database. A final clean browser load and an entry-module hot replacement produced no application console warnings/errors. The development entry point now disposes its previous React root before Vite re-evaluates it.

## Boundaries

The redesign does not change backend models, authentication policy, stored records, storage adapters, or API contracts. Live Cloudinary delivery and a physical-device camera were not re-tested for this UI change. The authenticated local browser session was retained; guest/login/register behavior is covered by component, session, and axe tests rather than signing out the user's other local sessions.

## English/Polish localization

The language feature adds six frontend regression tests covering live switching, device persistence and cross-tab synchronization, Polish plurals/dates/numbers, untranslated user content and canonical filter values, successful lure/catch submission from Polish forms, and translated authentication validation/API errors. The existing dashboard day-label test now explicitly uses the selected English locale. All **54 frontend tests and 17 API integration tests** pass, alongside lint, typecheck and production builds.

Browser checks verified Polish landing and sign-in pages at 320/768/1024/1440px without document overflow, plus language persistence on reload and navigation. The collection in Polish also passes the jsdom axe structural check. Authenticated translations and form behavior were verified through component tests; no user account or sample records were added to the local database for this change.

## Adjustable catch photo previews

Photo-position coverage verifies portrait/landscape drag calculations, keyboard-accessible range controls and reset, editing an existing catch without re-uploading, preview restoration after removing a pending replacement, replacement-file re-selection, saved crop/upload payloads, legacy centered fallback, server range validation, ownership, and persisted positions in catch/list/dashboard responses and after a real image upload. All **65 frontend tests and 20 API tests** pass, as do lint, typecheck and production builds.

The editor was visually checked with the project's generated sample image in a temporary development fixture at 320/768/1024/1440px, with no document overflow. The browser slider and center-reset controls updated both preview sizes. The fixture was removed after verification and no user records were created or changed for browser QA. Physical-device touch dragging has not been tested; pointer drag calculations are covered by component tests.

## SMTP and deployment preparation — 30 October 2026

Lint, workspace type checks, complete production build, all 85 frontend tests and 32 backend tests passed. New server tests cover missing production SMTP settings, TLS port mismatches, partial credentials, invalid origins, placeholder secrets, authenticated mail transport, reset-link composition and propagated delivery failure. Backend tests required local networking outside the sandbox for their isolated MongoDB replica set.

`node scripts/smoke-production.mjs` passed against the compiled application: built SPA routes, response security headers, Secure/HttpOnly host-prefixed cookies, real registration/session, exact-origin CSRF, unauthenticated private-route rejection and health status after database disconnect. The test creates only a temporary database and does not read `.env`.

No real SMTP connection, inbox delivery, provider DNS, live Cloudinary, deployed proxy topology, backup restoration or physical-device camera was verified. Dependency auditing was blocked by automatic approval review because it would upload dependency metadata to npm. The [launch runbook](../deployment.md) records remaining release gates and provider setup.
