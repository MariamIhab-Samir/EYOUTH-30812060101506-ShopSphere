# Rollback Procedure

This document describes how to roll back a bad production deployment on Vercel, and records the results of live-testing this procedure against our deployed services.

## When to Roll Back
- A production deployment crashes (500s / `FUNCTION_INVOCATION_FAILED`) or fails health checks.
- A bad deploy is caught via UptimeRobot alert or manual testing after a push.

## Procedure — Vercel Instant Rollback

1. Go to the affected project's **Overview** page.
2. Locate the **Production Deployment** tile.
3. Click **Instant Rollback**.
4. Confirm the rollback target shown (on Hobby plan, this is always the *immediately previous* production deployment — not a manually chosen one).
5. Confirm — traffic reroutes in a few seconds, no rebuild required.
6. Verify recovery via the service's `/health` endpoint or UptimeRobot.

### To Undo a Rollback
1. Return to the Production Deployment tile — a banner will show "To undo the rollback: promote to production".
2. Click **Undo Rollback** (or manually **Promote** the newer deployment from the Deployments list).
3. Verify the newer deployment is serving again.

### Important Gotcha
After an Instant Rollback, Vercel **disables auto-assignment of production domains**. New pushes to the production branch will **not** automatically go live until you either:
- Undo the rollback, or
- Manually re-enable auto-assigning custom domains / promote the latest deployment.

Forgetting this step means future deploys silently stop reaching production.

### Hobby Plan Limitation
Instant Rollback can only go back **one** deployment (the previous production deployment) — it is not possible to pick an arbitrary earlier "known-good" deployment from the list. If the previous deployment was also broken, rollback alone will not restore service — the underlying bug must be fixed directly.

---

## Live Test Results

### Backend
- Triggered Instant Rollback: reverted to the previous production deployment.
- **Discovery:** the previous deployment was itself broken (same crash), so the rollback did not restore service — this surfaced the Hobby-plan limitation above in practice, not just in theory.
- Rollback switch time: **~3–4 seconds**
- UptimeRobot detected the outage: **~1 second** after switch
- Undo Rollback switch time: **~2–3 seconds**
- UptimeRobot detected recovery + sent alert email: **~1 second** after switch
- Verified via UptimeRobot monitor and Vercel deployment logs.

### Frontend
- [Fill in after test: rollback/undo timing, whether it was seamless]

### Notification-service
- Same rollback/undo pattern tested as backend; rolled back into a previously-broken deployment (same root cause as backend at the time), required Undo Rollback to restore. Confirmed recovery via UptimeRobot.

### Review-service
- Rollback testing surfaced additional real production bugs (MongoDB Atlas IP whitelist, Mongoose connection handling) that were separate from the rollback mechanism itself — these were root-caused and fixed directly (see `PRODUCTION_README.md`) rather than papered over via rollback.

---

## Other Rollback Scenarios (Reference)

**Bad Prisma migration:** Use `npx prisma migrate resolve` or restore from the most recent database backup, depending on severity. (No live incident of this type occurred during testing.)

**Environment variable / secret restoration:** Values live in each Vercel project's Settings → Environment Variables. Keep a secure record of required variable names (not values) per service:
- Backend / Review-service: `MONGO_URI`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `EMAIL_FROM`, `JWT_SECRET`, `WEBHOOK_SECRET`, `APP_URL`, `CRON_SECRET`
- Notification-service: `MONGO_URI` (if applicable), SMTP vars, `WEBHOOK_SECRET`, `CRON_SECRET`