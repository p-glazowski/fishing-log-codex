# LureLog launch runbook

Status: local preparation is complete; external accounts, domain/DNS, real SMTP delivery, cloud image delivery, and hosted checks are pending. No provider has been provisioned or purchased.

## Hosting shape

The existing deployment target is one persistent Node process serving the frontend, API and private media on the same HTTPS origin. Use a MongoDB replica set and Cloudinary authenticated assets, or an explicitly backed-up persistent upload disk. Do not use the development MongoDB launcher for hosting.

Render paid hosting is a suitable option for this shape. Its Free service blocks standard SMTP ports and is not the production target. Build from the repository root with `npm ci --include=dev && npm run build`; run `npm start`; set health check path `/api/v1/health`. Keep one Node instance until rate limiting and cleanup are adapted for multiple instances. Use a supported Node version satisfying `package.json` and install dev dependencies during builds (TypeScript and Vite need them).

Netlify is also an option. A frontend on Netlify with the persistent API hosted separately requires `/api` and `/media` proxy rewrites before the SPA fallback, plus validation of cookie forwarding, proxy trust, IP-based rate limiting, uploads, and cache behavior. Keep `CLIENT_ORIGIN` set to the public Netlify/custom-domain origin. This split deployment has not been implemented or verified. Running the API in Netlify Functions instead requires a serverless adapter, connection reuse, scheduled durable cleanup, shared rate limiting and upload changes: Netlify documents an effective binary payload limit of approximately 4.5 MB, below the app's 5 MB input limit. Do not deploy the current server entry point directly as a Function.

## Email setup

One compatible option is Resend SMTP. First register a domain with a registrar of your choice. The app may initially use the host's HTTPS subdomain, but production email needs a domain you control. Add the sending domain/subdomain in Resend and publish the exact verification/DKIM/SPF records shown there. Confirm verification and configure DMARC for your sending domain following your provider's guidance. Do not invent DNS values or overwrite unrelated records.

Use `.env.production.example` as a checklist for host secrets, not as working credentials. For Resend:

```dotenv
SMTP_HOST=smtp.resend.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=resend
SMTP_PASSWORD=<sending API key from Resend>
SMTP_FROM=noreply@<your verified domain>
```

`SMTP_FROM` is a bare email address, not a display-name string. Use a restricted sending key where the provider supports it. Store secrets in the host's secret settings or an ignored local environment file; never in Git or frontend `VITE_*` variables. Port 587 requires STARTTLS; port 465 uses `SMTP_SECURE=true`. Certificate validation stays enabled.

From the repository root after `npm run build`, with credentials in `.env` or injected into the process:

```bash
# DNS, connection, TLS and authentication only; does not send email.
npm run smtp:check
# Sends one harmless diagnostic message to the address you supply.
npm run smtp:check -- recipient@example.com
```

The diagnostic command does not connect to MongoDB, create an account or issue a reset token. A successful connection check does not validate sender permission. A successful send means the SMTP server accepted the message; confirm actual inbox/spam delivery and inspect the provider's delivery result. Repeat from the deployed environment to check the host's SMTP egress. No real SMTP checks have passed yet: credentials and a verified sender are still required.

After deployment, use a dedicated account with an inbox you control to test the actual Forgot password workflow. Confirm the link uses the public HTTPS origin, opens the reset form, works once, accepts the new password, rejects the old password, and revokes existing sessions. Check expiry and delivery failure using the automated recovery tests; never paste a live reset link into logs or chat. Do not enable link tracking on recovery messages.

## Release checks

Run before deployment:

```bash
npm run lint
npm run typecheck
npm run test -w @lurelog/client -- --maxWorkers=2
npm run test -w @lurelog/server
npm run smoke:production
```

The smoke command builds the app, starts an isolated temporary MongoDB replica set, and checks the built SPA routes, headers, secure cookie attributes, registration/session, CSRF rejection, private endpoints and database-health failure. It never loads `.env`, sends email or contacts Cloudinary. It needs local socket access and may download MongoDB if not already cached.

Production dependency audit remains pending: `npm audit --omit=dev` requires network access and shares dependency names/versions with npm's registry. Automatic approval review rejected that disclosure in this session; obtain explicit approval before running it.

## Before opening public registration

- Configure all production secrets, a newly generated random JWT secret, exact HTTPS `CLIENT_ORIGIN`, and the actual database name in `MONGODB_URI`. Missing SMTP settings and invalid common TLS settings now stop startup.
- Use an authenticated MongoDB replica set, restrict database network access to the host, enable the backup option appropriate to your Atlas plan, and prove restoration into a separate database. Keep development and production databases separate.
- Enable Cloudinary authenticated delivery. Test uploading, viewing and removing lure/catch/avatar photos with two accounts; one account must not read another's media. Verify cleanup jobs clear. Ephemeral host disks are unsuitable for local photo storage.
- Set up a single trusted reverse proxy, HTTPS, correct forwarded protocol/client IP, and prevent public access that bypasses it. Verify `trust proxy=1` against the actual topology before launch. Set multipart limits above 5 MB and keep API/media responses private and uncached.
- Check registration, login, refresh, logout, Forgot password and password reset at the real origin, including mobile. Ensure session/CSRF cookies have Secure, HttpOnly, SameSite=Lax and no Domain attribute.
- Create/edit/delete a lure and catch, test local-date filtering, photo handling and dashboard refresh. Check direct SPA URLs and a server restart. Verify records and photos survive redeployment.
- Configure health monitoring, alerts for delivery errors and cleanup backlog, restart behavior and backups. Exercise rollback and a backup restore before trusting the deployment with the only copy of real data.
- Review public signup copy, support contact, privacy information and retention/deletion expectations for the actual launch audience. Remove only known disposable QA fixtures after checking ownership; do not delete existing user data.

## Sources checked on 30 October 2026

- [Resend SMTP configuration](https://resend.com/docs/send-with-smtp)
- [Resend domain verification](https://resend.com/docs/dashboard/domains/introduction)
- [Render free-service limitations](https://render.com/docs/free)
- [Express on Netlify](https://docs.netlify.com/build/frameworks/framework-setup-guides/express/)
- [Netlify Function limits](https://docs.netlify.com/build/functions/configuration/)
- [Nodemailer SMTP verification and TLS](https://nodemailer.com/smtp)
