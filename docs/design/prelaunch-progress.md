# Pre-launch usability work

Branch: `codex/prelaunch-usability`.

Completed and independently committed:

- `792a23e`: lure-first onboarding. Zero-catch dashboard shows two concrete steps. Catch entry with no lures gates the form; adding the first lure continues into a catch with that lure selected. Browser flow and 320/768/1024/1440 layouts verified; four onboarding regression tests.
- `a0005a6`: native Recent catches links and router scroll restoration. Browser verified saving opens catch details at scroll position zero and Back restores the previous position.
- `b8b7a88`: unsaved record/account change protection, including reload warnings, photo selection, and positioning.
- `d0f3e48`: journal filters in the URL, contextual return links through editing, active date indication, clear-filter recovery, compact filtering, and independent collection totals. Browser round-trip and four responsive widths verified.
- `46ffa20`: collapsed optional record fields, photo before additional details, reachable mobile Save bar, and correction of false unsaved warnings on blank forms. Optional values persist and saved optional fields open when editing.
- `8bc2002`: saved-photo removal for catches, lures, and avatars. Removal is staged until saving and supports Undo. Ownership, durable cleanup, and idempotence covered by backend integration tests. Browser verified staging and Undo.
- `01dfc49`: plain authentication validation, separate account-form state, password visibility controls, correct invalid-field focus, and return to protected destination after login.

Each item passed relevant frontend tests, production compilation, and lint before its commit. Server suite passed 23 tests after image-removal work. Last full frontend suite is being rerun; use `npm run test -w @lurelog/client -- --maxWorkers=2` to avoid excessive worker contention on this machine.

Latest local preparation (30 October 2026):

- Production now requires complete authenticated SMTP settings, validates TLS/origin configuration and rejects known placeholder JWT secrets.
- `npm run smtp:check` verifies SMTP without sending; supplying a recipient sends one diagnostic message. No real delivery has been tested yet.
- Production dependency audit passed after explicit user approval: zero known vulnerabilities reported by `npm audit --omit=dev --json`.
- Environment-injected hosting no longer requires a local `.env` file for `npm start`.
- Isolated production smoke passed against the built application; 85 frontend and 32 backend tests passed, plus lint, typecheck and build.
- README/UI contract updated for current onboarding, recovery and local-time behavior. See [launch runbook](../deployment.md).

Remaining launch work:

1. Choose/provision hosting, buy a domain and verify a sender; configure SMTP, MongoDB and durable photo storage secrets.
2. Send a real diagnostic email to the user-authorized recipient (kept in chat, not in tracked configuration), confirm inbox delivery and exercise the real recovery workflow.
3. Run hosted HTTPS/proxy/cookie and Cloudinary checks, configure monitoring/backups, and verify restoration/redeployment.

Temporary local QA account (agent-created, safe to remove after remaining work): `prelaunch-qa-20261029@example.test`, id `6ae3763f7132a03cd8b18f13`. It owns lure `6ae376947132a03cd8b18f14` and catch `6ae377a37132a03cd8b18f15`; the catch contains a bundled sample tackle-box image. Do not change other users' records. Credentials are available in the preceding chat tool calls. Existing Mobile Review account was only viewed.

Browser verification uses CUA and localhost:5173 (API 4000). Rebuilding shared code restarts the development API; wait for builds to finish and reload before browser checks. Viewport capability applies to the active tab. Last QA tab was id 4 in IAB, signed out on registration. Browser runtime reset once after a file-chooser timeout; always attach an error handler to chooser promises.

Screenshots and the original audit are under `/Users/piotr/.codex/visualizations/2026/10/29/01a1886f-f226-7fb3-b897-3cdf37fb9799/`, including `onboarding-first-lure.png`, `mobile-catch-save-bar.png`, `catch-save-at-top.png`, `journal-active-filters.png`, and `auth-friendly-validation.png`.
