# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

Requires Node.js 20.19+ (20.x) and npm 10+. Copy `.env.example` to `.env` before running the API; `src/config/env.config.js` validates required variables with envalid and exits the process if any is missing or invalid. `METRICS_TOKEN` is optional.

```bash
npm run dev              # nodemon src/app.js
npm start                # node src/app.js (connects to MongoDB before listening)
npm run lint             # eslint
npm run format:check     # prettier --check (npm run format to fix)
npm test                 # node scripts/run-tests.mjs
npm run test:coverage    # same under c8; fails below the line-coverage threshold in .c8rc.json
docker compose up --build  # API + MongoDB + MailDev (fake SMTP), no external accounts
```

CI (`.github/workflows/ci.yml`) runs `npm ci`, `npm audit --audit-level=high`, lint, format:check, and test:coverage on Node 20.19.

Tests use the built-in `node:test` runner. `scripts/run-tests.mjs` runs every `test/*.test.js` and fails if zero tests pass. `test/integration.test.js` drives the HTTP API with `mongodb-memory-server` (downloads a MongoDB binary on first run, or uses `MONGOMS_SYSTEM_BINARY`); other test files need no database and may stub repositories with `mock.method` or run an isolated HTTP app. Unit test files must `import "./helpers/env.js"` first, because env is parsed at import time. To run a subset, bypass the wrapper: `node --test --test-name-pattern="<pattern>" test/<file>.test.js`.

## Architecture

ESM-only Express 5 + Mongoose API. Internal imports use the `imports` map in `package.json` (`#api/*`, `#config/*`, `#lib/*`, `#middlewares/*`, `#server/*`) — use these rather than long relative paths across top-level folders.

**Startup is split so tests can reuse it.** `src/server/app.js` only creates the `express()` app and `http` server. `src/app.js` is the entrypoint: it connects to the DB, calls `applyGlobalMiddleware(app, router)` (`src/middlewares/global.middleware.js`: helmet, CORS, rate limit, cookie parser, body/query unsafe-key and HTML rejection, restricted metrics, Swagger UI, the API router, 404 and error handlers), then listens. The integration test imports the same pieces, sets `process.env` _before_ dynamically importing them (env is parsed at import time), and listens on port 0.

**Feature modules** live in `src/api/<feature>/` (auth, email, health, notification, otp, user) and layer as `routes → controller → service → repository → model`, with optional `*.dto.js` Joi schemas applied via `validateDto` (`src/middlewares/validation.middleware.js`, validates `req.body` only). `src/api/index.js` wires them: `/health` is at the root; feature routes otherwise sit under `/api/v1`. `/users` and `/notifications` are behind `verifyAccessToken`; `/auth`, `/email`, and `/otp` are public except for sign-out's token check. Global middleware also mounts `/metrics` and `/api-docs` at the root.

**Conventions to follow:**

- Controllers and middleware wrap async handlers in `handlePromise` (`src/lib/promise.lib.js`), which logs and forwards errors to `next`. Throw `http-errors` (`createError(status, msg)`); the global error handler serializes them (stack included outside production).
- Express 5's `req.query` is read-only — validate in place, never assign to it. Global validation runs before route matching, so it does not inspect `req.params` values.
- Ownership/authorization uses `requireOwner("<param>")` and `verifyAuthRole(...)` from `src/middlewares/auth.middleware.js`.
- JWTs have distinct purposes (access, email verification, password reset) — see `src/lib/token.lib.js`. The access token goes in an HTTP-only cookie (`COOKIE_NAME`), short or long expiry depending on `isRemembered`.
- Email goes through `src/lib/email.lib.js`, which exposes `setTestEmailSender` so tests stub delivery; HTML templates are in `src/views/`.
- File uploads: multer + Cloudinary (`upload.middleware.js`, `cloudinary.lib.js`).
- `src/server/sockets.js` holds the socket.io setup.

API docs: `swagger/api.swagger.yaml` (served at `/api-docs/`) and the Postman collection; update both when changing endpoints. Operator metrics use `METRICS_TOKEN` rather than the access cookie and return in-memory aggregate counts only.

## Known gaps (documented in README.md / SECURITY.md)

CORS currently reflects any origin with credentials, there is no CSRF protection or token revocation, reset tokens are not single-use, and `verifyAuthRole("admin")` on user deletion can never pass because issued access tokens carry no role. `/health/details` exposes configuration status to any authenticated user. Keep SECURITY.md and README.md in sync if you change any of these behaviors.
