# AGENTS.md

## Commands

```bash
# Server (port 5000) — ESM ("type": "module")
cd server
npm install
npm run dev        # node --watch server.js
npm run seed       # seed default roles + settings
npm run seed:admin # seed super admin only
npm run seed:admins# seed multiple super admins
npm run test       # NODE_ENV=test node --test tests/*.test.js  ← REQUIRES RUNNING MySQL
npm run db:migrate # run migrations
npm run db:reset   # reset database
npm start          # production

# Client (port 3000) — Vite dev server proxies /api and /uploads to :5000
cd client
npm install
npm run dev        # vite
npm run build      # vite build
npm run lint       # biome lint ./src
npm run lint:fix   # biome lint --write ./src
npm run format     # biome format --write ./src
npm run check      # biome check ./src (lint + format)
npm run check:fix  # biome check --write ./src (auto-fix)
npm run preview    # vite preview
```

No root-level scripts. Run client/server from their own directories.

## Architecture

- **Server**: Node.js + Express (ESM). Entry: `server/server.js` → `server/app.js`.
- **Client**: Vite 5 + React 18. Entry: `client/src/main.jsx`. `@` alias resolves to `client/src`.
- **Module pattern**: Each backend feature lives in `server/modules/<name>/` with `{name}.routes.js`, `{name}.controller.js`, `{name}.service.js`, `{name}.validator.js`, `{name}.model.js`. Exception: `superAdmin/` splits into `profile.routes.js` + `admins.routes.js`.
- **Stray top-level dir**: `server/services/pdf.service.js` exists outside the module pattern — shared utility.
- **Validation**: Zod schemas in `*.validator.js`, enforced by `server/middleware/validate.middleware.js`.
- **Auth**: Bearer JWT (or httpOnly cookies or query string for SSE). `authenticate` sets `req.user`. `authorize(...roles)` checks role name strings. `requirePermission(...perms)` checks role.permissions array. ADMIN role bypasses all checks. MFA (TOTP) is implemented.
- **Real-time**: Node.js `EventEmitter` (server, max 100 listeners) + SSE via `server/modules/sse/` (not Socket.io). Browser-side SSE via native `EventSource` in `client/src/hooks/useSSE.js`. Events defined in `server/events/index.js`.
- **Responses**: Standard shape `{ success, message, data, pagination? }`. Use `ApiResponse` helper and `ApiError` class (both in `server/utils/http/`).
- **API docs**: Swagger UI at **`/api-docs`** (not `/api/docs`). Config in `server/config/swagger.config.js`. The root `/api` route redirects browsers to `/api/docs` which is a dead link — use `/api-docs` directly.
- **Multi-tenancy**: Subdomain-based tenant extraction via `server/middleware/subdomain.middleware.js`. Tenant management in `server/modules/tenant/`.
- **Tenant statuses**: Only ACTIVE, SUSPENDED, DELETED. No PAUSED, PENDING_KYC, or REJECTED.
- **Subscription enforcement**: Dual — cron job (`server/jobs/subscriptionChecker.js`) auto-suspends expired tenants hourly + per-request `expires_at` check in `server/middleware/tenant.middleware.js`.

## Environment

- **Server env**: `server/.env` (loaded via `server/config/env.config.js`, always from `server/` root). Required: `JWT_SECRET` (min 10 chars). DB vars: `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` (MySQL/MariaDB). Optional: SMTP vars for OTP emails, `ADMIN_EMAIL`/`ADMIN_PHONE`, `SHOP_URLS` (comma-separated client URLs for CORS).
- **Client env**: `client/.env` with `VITE_API_URL` (default `http://localhost:5000/api/v1` for local dev). Vite exposes only `VITE_*` vars. `VITE_BASE_DOMAIN` controls subdomain routing.
- **Database**: MySQL/MariaDB via Knex (`server/config/db.knex.js`). NOT MongoDB. Schema dump at `server/schema.sql`. Defaults: `localhost:3306`.
- **CORS**: Allows `APP_URL`, `CLIENT_URL`, `ALLOWED_ORIGIN`, `SHOP_URLS`, `localhost:3000`, `localhost:5173`. Permissive in dev; strict in production.
- **Root `.env.example` is stale** — still references MongoDB. Use `server/.env.example` instead.

## Frontend Conventions

- **State**: Zustand for theme/design-mode (`client/src/store/themeStore.js`) and auth. React Context compatibility shim in `client/src/context/` (just re-exports Zustand). TanStack Query for server state.
- **Routing**: React Router v7. All dashboard pages lazy-loaded in `client/src/App.jsx`. Routes protected by `ProtectedRoute` and `RoleBasedRoute` (permission-based, e.g. `sales:view`).
- **UI**: shadcn/ui (Radix primitives) + Tailwind v3. Dark mode via `.dark` class on `<html>`. Design modes set via `data-mode` attribute on `<html>`. 5 toggleable modes in code: `flat`, `neumorphism`, `glassmorphismpro`, `liquidglass`, `aurora`. Stored in Zustand persist as `theme-storage`.
- **Linting/Formatting**: Biome (not ESLint — no ESLint config exists). Config: `client/biome.json`. Indent: 2 spaces, single quotes, semicolons always, 100-char line width. Use `check:fix` to auto-fix.
- **Icons**: Lucide React primary.
- **Offline**: `client/src/utils/offlineSync.js` + `offlineDB.js` using `idb` (IndexedDB). No service worker / workbox — just client-side caching.
- **API client**: `client/src/lib/api.js` (Axios with Bearer interceptor + automatic 401 refresh-token flow via httpOnly cookies). Asset URLs resolved via `getAssetUrl()`.

## Gotchas

- Server is flat in `server/` (not `server/src/` as PROJECT-SPEC.md or older deployment configs suggest).
- **Swagger docs path**: Mounts at `/api-docs`, not `/api/docs`. The README and root route reference `/api/docs` but that path 404s.
- Frontend login uses `/auth/login-direct` (bypasses OTP). OTP flow exists on backend (`/auth/login` + `/auth/verify-otp`) but frontend currently skips it.
- Root `.env.example` still references MongoDB (`MONGODB_URI`) but the actual DB is MySQL/MariaDB — use `server/.env.example` with `DB_HOST`/`DB_PORT`/`DB_USER`/`DB_PASSWORD`/`DB_NAME` instead.
- `mongoose` is in `server/package.json` dependencies but is **never imported** — dead dependency. The entire backend uses Knex + MySQL2 exclusively.
- User model stores password in `passwordHash` (with `select: false`); you must explicitly `.select('+passwordHash')` when needed.
- Tests exist in `server/tests/` but no CI or pre-commit hooks. **Tests require a running MySQL instance** — `npm run test` will fail without it.
- Lockfiles: client has both `package-lock.json` and `pnpm-lock.yaml`. Use npm unless pnpm is explicitly needed.
- `server/schema.sql` contains a MySQL 8.4 dump of the full schema — useful for understanding table structure but **not** used for migrations (Knex migrations in `server/migrations/` are the source of truth).
- **Branch/Outlet system removed**: No branches, stock transfers, or branch scoping. Single-tenant inventory per subdomain.
- **Stock transfer feature removed**: `/api/v1/stock` routes and `/stock-transfer` frontend page removed. Stock is per-product in `products.stock_quantity`.

## Server Modules (33)

`accounting`, `attendance`, `audit`, `auth`, `catalog`, `contact`, `customer`, `documentVault`, `employee`, `expense`, `imei`, `investor`, `leave`, `loan`, `notification`, `payroll`, `plans`, `product`, `purchase`, `repair`, `report`, `role`, `sale`, `settings`, `sse`, `superAdmin`, `supplier`, `tenant`, `ticket`, `user`, `warranty`, `wholesale`

## Security Notes

- JWT secret is required via `JWT_SECRET` env var; no fallback — server exits on missing value.
- Auth supports Bearer header, httpOnly cookies (`accessToken` + `refreshToken`), and query string (for SSE `EventSource` which can't set headers). Client uses both Bearer + cookies for backward compat.
- ADMIN role bypasses `authorize()` and `requirePermission()` checks.
- Password reset tokens are never returned in API responses; sent via email only.
- File uploads validate both MIME type and file magic numbers using `file-type` package.
- CORS requires explicit origin configuration via `CLIENT_URL`, `APP_URL`, `ALLOWED_ORIGIN`, or `SHOP_URLS` env vars.
- Helmet configured with CSP, HSTS, and strict referrer policy.
- Seed passwords must be provided via `SEED_PASSWORD_<ROLE>` env vars in production.
- `server/.env` and `server/uploads/` are gitignored; never commit secrets.
- Failed login attempts tracked per IP+identifier via `server/middleware/security.middleware.js`.
- All auth failures log `LOGIN_FAILED` security events with IP, user-agent, and attempt count.
