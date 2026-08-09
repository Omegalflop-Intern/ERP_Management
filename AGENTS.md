# AGENTS.md

## Commands

```bash
# Server (port 5000) — ESM ("type": "module")
cd server
npm install
npm run dev       # node --watch server.js
npm run seed      # seed default roles + settings
npm run test      # NODE_ENV=test node --test tests/*.test.js
npm start         # production

# Client (port 3000) — Vite dev server proxies /api and /uploads to :5000
cd client
npm install
npm run dev       # vite
npm run build     # vite build
npm run lint      # biome lint ./src
npm run format    # biome format --write ./src
npm run check     # biome check ./src (lint + format)
npm run preview   # vite preview
```

No root-level scripts. Run client/server from their own directories.

## Architecture

- **Server**: Node.js + Express (ESM). Entry: `server/server.js` → `server/app.js`.
- **Client**: Vite 5 + React 18. Entry: `client/src/main.jsx`. `@` alias resolves to `client/src`.
- **Module pattern**: Each backend feature lives in `server/modules/<name>/` with `{name}.routes.js`, `{name}.controller.js`, `{name}.service.js`, `{name}.validator.js`, `{name}.model.js`.
- **Stray top-level dir**: `server/services/pdf.service.js` exists outside the module pattern — shared utility.
- **Validation**: Zod schemas in `*.validator.js`, enforced by `server/middleware/validate.middleware.js`.
- **Auth**: Bearer JWT (or httpOnly cookies). `authenticate` sets `req.user`. `authorize(...roles)` checks role name strings. `requirePermission(...perms)` checks role.permissions array. MFA (TOTP) is implemented.
- **Real-time**: Node.js `EventEmitter` (server) + SSE via `server/modules/sse/` (not Socket.io). Browser-side EventEmitter in `client/src/utils/EventEmitter.js`. Events defined in `server/events/index.js`.
- **Responses**: Standard shape `{ success, message, data, pagination? }`. Use `ApiResponse` helper and `ApiError` class (both in `server/utils/http/`).
- **API docs**: Swagger UI at **`/api-docs`** (not `/api/docs`). Config in `server/config/swagger.config.js`. The root `/api` route redirects browsers to `/api/docs` which is a dead link — use `/api-docs` directly.
- **Multi-tenancy**: Subdomain-based tenant extraction via `server/middleware/subdomain.middleware.js`. Tenant management in `server/modules/tenant/`.

## Environment

- **Server env**: `server/.env` (loaded via `server/config/env.config.js`, validated with Zod). Required: `JWT_SECRET` (min 10 chars). Optional: SMTP vars for OTP emails.
- **Client env**: `client/.env` with `VITE_API_URL` (default `http://localhost:5000/api/v1`). Vite exposes only `VITE_*` vars.
- **MongoDB**: `MONGODB_URI` in server env. Defaults to `mongodb://127.0.0.1:27017/mobile_shop_erp`. Docker compose uses service name `mongodb`.
- **CORS**: Allows `APP_URL`, `CLIENT_URL`, `ALLOWED_ORIGIN`, `localhost:3000`, `localhost:5173`. Permissive in dev; strict in production.

## Frontend Conventions

- **State**: Zustand for theme/design-mode (`client/src/store/themeStore.js`) and auth. React Context compatibility shim in `client/src/context/`. TanStack Query for server state.
- **Routing**: React Router v7. All dashboard pages lazy-loaded in `client/src/App.jsx`. Routes protected by `ProtectedRoute` and `RoleBasedRoute` (permission-based, e.g. `sales:view`).
- **UI**: shadcn/ui (Radix primitives) + Tailwind v3. Dark mode via `.dark` class on `<html>`. Design modes set via `data-mode` attribute: `flat`, `neumorphism`, `glassmorphism`, `liquidglass`, `neobrutalism`, `aurora`, `glassmorphismpro` (7 modes, stored in Zustand persist as `theme-storage`).
- **Linting/Formatting**: Biome (not ESLint). Config: `client/biome.json`. Indent: 2 spaces, single quotes, semicolons always, 100-char line width.
- **Icons**: Lucide React primary.
- **Offline**: `client/src/utils/offlineSync.js` + `offlineDB.js` using `idb` and `workbox-window`.
- **API client**: `client/src/lib/api.js` (Axios with Bearer interceptor + automatic 401 refresh-token flow via httpOnly cookies). Asset URLs resolved via `getAssetUrl()`.

## Gotchas

- Server is flat in `server/` (not `server/src/` as PROJECT-SPEC.md or older deployment configs suggest).
- **Swagger docs path**: Mounts at `/api-docs`, not `/api/docs`. The README and root route reference `/api/docs` but that path 404s.
- Frontend login uses `/auth/login-direct` (bypasses OTP). OTP flow exists on backend (`/auth/login` + `/auth/verify-otp`) but frontend currently skips it.
- MongoDB connect warns about "memory DB fallback" but does not implement one — it just returns `false`.
- User model stores password in `passwordHash` (with `select: false`); you must explicitly `.select('+passwordHash')` when needed.
- Tests exist in `server/tests/` but no CI or pre-commit hooks. Run `npm run test` in server dir to verify.
- Lockfiles: client has both `package-lock.json` and `pnpm-lock.yaml`. Use npm unless pnpm is explicitly needed.
- `docker-compose.yml` contains a hardcoded `JWT_SECRET` — replace with env var for real deployments.

## Server Modules (32)

`accounting`, `attendance`, `audit`, `auth`, `branch`, `catalog`, `contact`, `customer`, `documentVault`, `employee`, `expense`, `imei`, `investor`, `leave`, `loan`, `notification`, `payroll`, `plans`, `product`, `purchase`, `repair`, `report`, `role`, `sale`, `settings`, `sse`, `stock`, `supplier`, `tenant`, `user`, `warranty`, `wholesale`

## Security Notes

- JWT secret is required via `JWT_SECRET` env var; no fallback — server exits on missing value.
- Auth supports both Bearer header and httpOnly cookies (`accessToken` + `refreshToken`). Client uses both for backward compat.
- Password reset tokens are never returned in API responses; sent via email only.
- File uploads validate both MIME type and file magic numbers using `file-type` package.
- CORS requires explicit origin configuration via `CLIENT_URL`, `APP_URL`, or `ALLOWED_ORIGIN` env vars.
- Helmet configured with CSP, HSTS, and strict referrer policy.
- Seed passwords must be provided via `SEED_PASSWORD_<ROLE>` env vars in production.
- `server/.env` and `server/uploads/` are gitignored; never commit secrets.
- Failed login attempts tracked per IP+identifier via `server/middleware/security.middleware.js`.
- All auth failures log `LOGIN_FAILED` security events with IP, user-agent, and attempt count.
