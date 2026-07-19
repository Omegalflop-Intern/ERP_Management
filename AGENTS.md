# AGENTS.md

## Commands

```bash
# Server (port 5000)
cd server
npm install
npm run dev       # node --watch server.js
npm run seed       # seed default roles + settings
npm start          # production

# Client (port 3000)
cd client
npm install
npm run dev        # vite dev server, proxies /api and /uploads to :5000
npm run build      # vite build
npm run lint       # eslint . --ext js,jsx
npm run preview    # vite preview
```

No root-level scripts. Run client/server from their own directories.

## Architecture

- **Server**: Node.js + Express (ESM). Entry: `server/server.js` -> `server/app.js`.
- **Client**: Vite 5 + React 18. Entry: `client/src/main.jsx`. `@` alias resolves to `client/src`.
- **Module pattern**: Each backend feature lives in `server/modules/<name>/` with `{name}.routes.js`, `{name}.controller.js`, `{name}.service.js`, `{name}.validator.js`, `{name}.model.js`.
- **Validation**: Zod schemas in `*.validator.js`, enforced by `server/middleware/validate.middleware.js`.
- **Auth**: Bearer JWT. `authenticate` sets `req.user`. `authorize(...roles)` checks role names. `requirePermission(...perms)` checks role.permissions array.
- **Real-time**: Node.js `EventEmitter` (server) + browser `EventEmitter` (client). No Socket.io. Events defined in `server/events/index.js` and `client/src/utils/EventEmitter.js`.
- **Responses**: Standard shape `{ success, message, data, pagination? }`. Use `ApiResponse` helper and `ApiError` class.
- **API docs**: Swagger at `/api/docs` via `swagger-jsdoc` + `swagger-ui-express`. Config in `server/config/swagger.config.js`.

## Environment

- **Server env**: `server/.env` (dotenv loaded in `server/config/env.config.js`). Required: `JWT_SECRET`. Optional SMTP for OTP emails (falls back to Ethereal in dev).
- **Client env**: `client/.env` with `VITE_API_URL` (default `http://localhost:5000/api/v1`). Vite exposes only `VITE_*` vars.
- **MongoDB**: `MONGODB_URI` in server env. Defaults to `mongodb://127.0.0.1:27017/mobile_shop_erp`. Docker compose uses service name `mongodb`.
- **CORS**: Allows `APP_URL`, `CLIENT_URL`, `localhost:3000`, `localhost:5173`. Permissive in non-production.

## Frontend Conventions

- **State**: React Context for auth/theme. TanStack Query for server state.
- **Routing**: React Router v7. All pages lazy-loaded inside `DashboardLayout`. Routes protected by `ProtectedRoute` and `RoleBasedRoute`.
- **UI**: shadcn/ui (Radix primitives) + Tailwind v3. Dark mode via `.dark` class. Custom design modes: `flat`, `neumorphism`, `glassmorphism`, `liquidglass`, `neobrutalism` (stored in `localStorage` as `designMode`).
- **Icons**: Lucide React primary.
- **Offline**: `client/src/utils/offlineSync.js` + `offlineDB.js` using `idb` and `workbox-window`.
- **API client**: `client/src/lib/api.js` (Axios instance with Bearer interceptor + 401 refresh-token flow). Asset URLs resolved via `getAssetUrl()`.

## Gotchas

- Server is flat in `server/` (not `server/src/` as older docs or deployment configs suggest).
- **Dockerfile bug**: `CMD` references `server/src/app.js` but the file is `server/app.js` — no `server/src/` directory exists. Same issue in `ecosystem.config.js` (PM2). Both need `server/app.js` to work.
- Frontend login uses `/auth/login-direct` (bypasses dev OTP). OTP flow exists on backend but frontend currently skips it.
- MongoDB connect warns about "memory DB fallback" but does not implement one — it just returns `false`.
- User model stores password in `passwordHash`; some legacy middleware still references `+password`. Be careful when editing auth paths.
- No tests, CI, or pre-commit hooks exist.
- Lockfiles: client has `package-lock.json`, `pnpm-lock.yaml`, and `pnpm-workspace.yaml`. Use npm unless pnpm is explicitly needed.

## Server Modules (26 total)

`accounting`, `attendance`, `auth`, `branch`, `catalog`, `customer`, `employee`, `expense`, `imei`, `investor`, `leave`, `loan`, `notification`, `payroll`, `product`, `purchase`, `repair`, `report`, `role`, `sale`, `settings`, `stock`, `supplier`, `user`, `warranty`, `wholesale`

## Security Notes

- JWT secret is required via `JWT_SECRET` env var; no fallback exists in `server/utils/generateToken.js`.
- Password reset tokens are never returned in API responses; they are sent via email only.
- File uploads validate both MIME type and file magic numbers using `file-type` package.
- CORS requires explicit origin configuration via `CLIENT_URL`, `APP_URL`, or `ALLOWED_ORIGIN` env vars.
- Helmet is configured with CSP, HSTS, and strict referrer policy.
- Seed passwords must be provided via `SEED_PASSWORD_<ROLE>` env vars in production.
- `server/.env` and `server/uploads/` are gitignored; never commit secrets.
- npm audit shows 1 high vulnerability in `xlsx` (no fix available) and 1 moderate in `esbuild` (requires breaking change). These are accepted risks.
- Failed login attempts are tracked per IP+identifier. 5 failures in 15 minutes triggers a `BRUTE_FORCE_DETECTED` security event logged to `AuditLog`.
- All auth failures (invalid credentials, deactivated accounts) log `LOGIN_FAILED` security events with IP, user-agent, and attempt count.
