# E-Commerce API

REST API for an e-commerce backend built with **TypeScript**, **Express**, **Mongoose**, **Zod**, **JWT**, **Stripe**, and **Cloudinary**.

## Tech Stack

- **Runtime:** Node.js 20+
- **Framework:** Express 5 (TypeScript)
- **Database:** MongoDB + Mongoose (with transactions)
- **Validation:** Zod (env + request DTOs)
- **Auth:** JWT (Bearer access token + httpOnly refresh cookie)
- **Payments:** Stripe Checkout + raw signed webhooks
- **Storage:** Cloudinary for image uploads
- **Email:** Resend API for transactional mail
- **Testing:** Vitest + Supertest + MongoDB Memory Server
- **Docs:** OpenAPI 3.0 (`/api-docs`)

## Quick Start

```bash
# Install dependencies
npm install

# Setup environment
cp .env.example .env
# Configure required env vars: MONGODB_URI, JWT secrets, BASE_URL, CLIENT_ORIGIN, RESEND_API_KEY

# Start dev server
npm run dev
```

> 💡 **Using pnpm or yarn?**  
> Replace `npm install` with `pnpm install` or `yarn`, and `npm run <script>` with `pnpm <script>` or `yarn <script>`.

- API base: `/api/v1`
- Health check: `GET /health`
- API docs: `GET /api-docs`

## Scripts

| Script              | Description                               |
| ------------------- | ----------------------------------------- |
| `npm run dev`       | Run with `tsx watch` (dev mode)           |
| `npm run build`     | Compile to `dist/`                        |
| `npm start`         | Run compiled app (`node dist/server.js`)  |
| `npm test`          | Run integration tests (in-memory MongoDB) |
| `npm run typecheck` | Type-check only (`tsc --noEmit`)          |
| `npm run lint`      | Lint `src/` and `tests/`                  |

## Project Structure

```
src/
  app.ts              # App factory: middleware, routes, webhook mount
  server.ts           # Bootstrap: env, DB, server listen
  config/             # Env validation (Zod), DB connection
  controllers/        # Request handlers
  routes/             # Express routers
  models/             # Mongoose schemas
  middleware/         # Auth, validation, error handling, uploads
  services/           # Cloudinary, inventory logic
  lib/                # Utilities: ApiFeatures, pricing, asyncHandler
  validation/         # Reusable Zod schemas
tests/                # Integration tests (Vitest + Supertest)
docs/openapi.json     # OpenAPI spec for Swagger UI
```

## Environment Variables

Copy `.env.example` → `.env`. Required vars validated at startup (`src/config/env.ts`):

| Variable             | Purpose                                    |
| -------------------- | ------------------------------------------ |
| `MONGODB_URI`        | MongoDB connection string                  |
| `JWT_ACCESS_SECRET`  | Access token secret (≥10 chars)            |
| `JWT_REFRESH_SECRET` | Refresh token secret (≥10 chars)           |
| `BASE_URL`           | Server URL (e.g., `http://localhost:8000`) |
| `CLIENT_ORIGIN`      | Allowed CORS origin                        |
| `RESEND_API_KEY`     | Resend API key for password reset emails   |
| `STRIPE_*`           | Stripe keys (required for payments)        |
| `CLOUDINARY_*`       | Cloudinary config (for image uploads)      |

## CI/CD

GitHub Actions (`.github/workflows/ci.yml`) runs on push/PR:

- Install → typecheck → lint → test → build  
  _(Uses `pnpm` in CI for speed — but the app works with any package manager.)_

## Contributing

1. Fork and create a feature branch
2. Ensure tests pass and types check
3. Open a PR with a concise description of changes
