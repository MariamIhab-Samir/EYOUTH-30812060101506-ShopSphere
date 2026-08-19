# Production Deployment — Summary of Work

**Project:** Project5Final
**Stack:** Node/Express + Prisma (backend, notification-microservice, review-service) · Mongoose/MongoDB Atlas (activity logging, reviews) · React/Vite frontend served via nginx · Hosted on Vercel (Hobby plan)

This document summarizes the production hardening, deployment, and monitoring work completed for this project, along with known open items.

---

## 1. Production URL Configuration
- Migrated frontend/backend from `localhost` references to production URLs.
- `.env.example` files updated as documentation/reference (non-secret production URLs); actual secrets live in gitignored `.env` files consumed at build/runtime.
- Confirmed `docker-compose.yml` is dev-only and not part of the Vercel deployment; only the Dockerfiles' build-time behavior (e.g. frontend's `npm run build` inlining env vars) mattered for production values.

## 2. Scheduled Jobs — Migrated off node-cron to Vercel Cron
- **Problem:** `node-cron` assumes a long-running process; Vercel's serverless model doesn't support this.
- **Reservation cleanup (`releaseExpiredReservations`):** converted to a hybrid approach —
  - Called inline at the start of `addToCart`, `getCart`, and `updateCartItem` for near-real-time accuracy (no cost, no plan requirement).
  - Backed by a daily Vercel Cron job (`/api/cron/releaseExpired`, `0 3 * * *`) as a catch-all for reservations never touched by a request.
- **Promo emails (`sendPromoNotificationEmails`):** pure daily batch job, no inline equivalent needed — scheduled via Vercel Cron (`/api/cron/sendPromoEmails`, `0 9 * * *`).
- Confirmed: Vercel Hobby plan cron jobs are limited to once-per-day scheduling; more frequent expressions fail at deploy time.
- Old `node-cron`-based `scheduler.js` and its calls removed from `app.js` where identified.

## 3. Production Security Hardening
Applied to all three Express services (backend, notification-service, review-service):
- **Helmet** — standard security headers.
- **express-rate-limit** — 100 requests / 15 min window.
- **CORS** — restricted to explicit allowed origins (production frontend + localhost dev), replacing an unconfigured/default setup.
- **`app.set('trust proxy', 1)`** — required for `express-rate-limit` to correctly validate `X-Forwarded-For` headers behind Vercel's proxy; omitting this caused hard crashes on every request.

## 4. Production Bugs Found & Fixed
| Issue | Root Cause | Fix |
|---|---|---|
| Backend deploy crash | `express-rate-limit` installed locally but not committed to `package.json` | Reinstalled with `--save`, committed lockfile |
| `X-Forwarded-For` validation crash (all services) | Missing `trust proxy` setting behind Vercel's proxy | Added `app.set('trust proxy', 1)` |
| CORS origin restriction silently bypassed (review-service, notification-service) | Leftover duplicate `app.use(cors())` (no options) after the restricted config | Removed the duplicate unrestricted call |
| Notification-service crash on boot | `startPromoEmailJob()` called but never imported | Removed (superseded by Vercel Cron) |
| Intermittent 200/500 on `/health` (review-service, backend) | Mongoose reconnecting fresh on every serverless invocation, exhausting MongoDB Atlas connection limits | Added connection caching (`isConnected` flag) so warm instances reuse the existing connection |
| `MongooseServerSelectionError` / could not connect to Atlas | Atlas Network Access only allowed specific static IPs; Vercel serverless functions use dynamic IPs | Added `0.0.0.0/0` to Atlas IP Access List |
| `notification_service health` monitor showing 404 | Health check was pointed at root URL instead of `/health` | Corrected monitor URL |
| Mailer `Client network socket` error | Under investigation — likely missing/incorrect SMTP env vars in Vercel Production environment, or SMTP being blocked from serverless IPs | `transporter.verify()` issue addressed; recommend confirming env vars are set per-project in Vercel dashboard, or migrating to an HTTP-based email API (Resend/SendGrid/Postmark) for serverless reliability |

## 5. Uptime Monitoring
- UptimeRobot (free tier) configured across all 4 deployed services: backend, frontend, notification-service, review-service.
- 5-minute check interval, email alerts on downtime/recovery.
- Frontend monitored via root URL (200 check) rather than a dedicated `/health` route, since it's static content served by nginx with no backend logic.
- Verified end-to-end: monitors correctly caught every real outage introduced during testing (rollback tests, mid-fix crashes) and confirmed recovery within ~1 second of service restoration.
- Public status page available for reviewer verification: **[add UptimeRobot public status page link here]**

## 6. Rollback Testing
See `ROLLBACK.md` for the full procedure and live test results.

## 7. Known Open Items
- Mailer SMTP configuration — needs final confirmation of env vars in Vercel Production settings for backend and notification-service.
- Structured logging (e.g. `pino`) — not implemented; current logging is `console.log`/`console.error`.
- CI/CD pipeline (Task 5) — not implemented; no workflow file, no branch protection.
- K8s namespace simulation (Task 2, local minikube/kind) — not started.
- Coupon accuracy fixes — flagged as needing rework after other bug fixes.
- `adminAddProduct` duplicate-name handling — still returns generic 500 instead of a specific error.
- Review-service survival across a main-app redeploy — not explicitly tested.