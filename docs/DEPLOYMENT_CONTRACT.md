# Deployment Contract

## Scope

This document defines deployment expectations for OutreachPro across local development, Vercel frontend environments, and Render backend environments.

## Environment Matrix

| Environment | Frontend Host | Backend Host | API Base Source | Notes |
|-------------|---------------|--------------|-----------------|-------|
| local | localhost:3000 | localhost:8000 | Next rewrite fallback to `http://127.0.0.1:8000/api/:path*` | Used for day-to-day development |
| Vercel preview | Vercel preview URL | Render staging/prod API URL | `NEXT_PUBLIC_API_URL` | Preview builds must target non-local API |
| Vercel production | Primary custom domain | Render production URL | `NEXT_PUBLIC_API_URL` | Must match production backend domain |
| Render production | N/A | Render web service | Render env vars | Hosts FastAPI runtime |

## API URL Resolution

Resolution behavior is defined in `web/next.config.ts` and `web/src/services/api.ts`:

1. If `NEXT_PUBLIC_API_URL` is set, frontend uses that origin and appends `/api` if needed.
2. If `NEXT_PUBLIC_API_URL` is not set, dev rewrite proxies `/api/*` to `http://127.0.0.1:8000/api/*`.
3. Preview and production deployments must set `NEXT_PUBLIC_API_URL` explicitly.

## Required Variables By Platform

### Vercel frontend
- `NEXT_PUBLIC_API_URL` (required outside local dev)

### Render backend
- `FRONTEND_URL`
- `SESSION_SECRET`
- `JWT_SECRET`
- `SECRET_KEY`
- `DATABASE_URL` (prod)
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`

## Rollback Checklist

1. Confirm latest known-good backend image/release in Render.
2. Roll back Render deployment to last healthy release.
3. Confirm `/health` returns 200 and database status `ok`.
4. Repoint Vercel `NEXT_PUBLIC_API_URL` if backend domain changed.
5. Redeploy/revert Vercel to last known-good deployment.
6. Verify critical flows:
   - `/signup` registration
   - `/login` auth
   - `/dashboard` stats fetch
   - upload -> draft -> send
   - Stripe webhook processing

## Canonical Config References

- `web/next.config.ts`
- `vercel.json`
- `.env.example`
- `Dockerfile`
