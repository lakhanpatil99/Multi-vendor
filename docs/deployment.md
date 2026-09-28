# Deployment — Vercel (Frontend)

The web application is the Next.js app in **`/frontend`**. This is a monorepo, so
Vercel must be told that `/frontend` is the project root. That single setting is
what fixes the `404: NOT_FOUND` deployment.

## Why the 404 happened

The Vercel project was building from the repository root (`Multi-vendor/`), where
there is no Next.js app — only `backend/`, `frontend/`, `docs/`, etc. With no app
at the root, Vercel produced an empty deployment and every route returned 404.

## Fix: set the Root Directory (one-time, in the Vercel dashboard)

1. Vercel → your project → **Settings** → **Build and Deployment**.
2. Find **Root Directory** and set it to:
   ```
   frontend
   ```
3. Save. Framework Preset should auto-detect **Next.js** (leave build/output
   settings on their defaults — do not override them).
4. **Deployments** → **Redeploy** the latest commit.

That is the only change required. Vercel then handles Next.js routing, static
assets, server rendering, and future API routes natively.

### Auto-detected settings (do not override)

| Setting | Value |
|---------|-------|
| Framework Preset | Next.js |
| Root Directory | `frontend` |
| Build Command | `next build` (default) |
| Install Command | `npm install` (default) |
| Output Directory | (Next.js default — leave empty) |

No `vercel.json` is needed. A standard Next.js app deploys natively once the Root
Directory is correct, so none was added (adding build/routing overrides would only
risk breaking native detection).

## Local production testing

From `frontend/`:

```bash
npm install
npm run build     # production build (must exit 0)
npm run start     # serves the production build on http://localhost:3000
```

Verified locally: `/` redirects (307) to `/dashboard`, and pages such as
`/dashboard` and `/devices/[id]` return 200 under `next start`.

## Ignored files

`.vercel/` (created by the Vercel CLI) is ignored via the root and
`frontend/` `.gitignore` files, alongside `node_modules/`, `.next/`, and `.env*`.
