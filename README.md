# MERN Backend Starter

## Overview

MERN Backend Starter is a Node.js and Express backend template using ES modules, MongoDB through Mongoose, feature-oriented API modules, centralized runtime configuration, Swagger documentation, email templates, cookie-based JWT authentication, and file upload support through Cloudinary storage. A test command is configured, but no tests are currently tracked.

This README reflects the current repository state, including known limitations and technical debt. It should be treated as the source of truth for local setup, available commands, architecture, and current production-readiness gaps.

## Features

- Express 5 API server with versioned routes under `/api/v1`. The current middleware stack prevents requests from succeeding; see [Known Issues](#known-issues).
- MongoDB connection through Mongoose.
- Feature modules for auth, email verification, OTP, health, notifications, and users.
- Layered route -> controller -> service -> repository -> model flow for most modules.
- JWT authentication stored in an HTTP cookie.
- A role guard on user deletion; tokens created by this application do not contain a role, so this route currently rejects normal signed-in users.
- Joi request validation on selected auth routes.
- Email delivery through Nodemailer and HTML templates in `src/views`.
- Cloudinary-backed `multer` storage for avatar uploads.
- Swagger UI mounted at `/api-docs`.
- Postman collection included in `Generic Backend API.postman_collection.json`.
- ESLint, Prettier, and a configured Node built-in test runner.

Current limitations are documented in [Known Issues](#known-issues).

## Tech Stack

- Runtime: Node.js with ES modules
- Server: Express
- Database: MongoDB with Mongoose
- Validation: Joi
- Environment validation: dotenv and envalid
- Authentication: JSON Web Tokens and cookie-parser
- Password hashing: bcryptjs
- Email: Nodemailer
- Uploads: multer, multer-storage-cloudinary, Cloudinary
- Logging: Winston and Morgan
- API docs: swagger-jsdoc and swagger-ui-express
- Testing: Node's built-in test runner is configured; no test files are currently tracked
- Tooling: ESLint 9 and Prettier 3

Applied in global middleware:

- `helmet`
- `compression`
- `express-mongo-sanitize`
- `express-rate-limit`
- `xss-clean`

## Project Structure

```text
.
  src/
    app.js                         # Application bootstrap: DB connect, middleware, routes, listen
    api/
      index.js                     # Root API router and /api/v1 route mounting
      auth/                        # Signup, signin, signout, password reset
      email/                       # Verification email send/verify flows
      health/                      # Basic and detailed health checks
      notification/                # Notification list/update feature
      otp/                         # OTP send/verify feature
      user/                        # User read/update/delete feature
    config/
      env.config.js                # Validated environment configuration
      swagger.config.js            # Swagger/OpenAPI configuration
    lib/                           # Shared helpers: database, tokens, cookies, email, files, logging
    middlewares/                   # Global, auth, upload, and validation middleware
    server/
      app.js                       # Express and HTTP server instances
      sockets.js                   # Socket.IO setup module, currently not imported by bootstrap
    views/                         # HTML email templates
  swagger/
    api.swagger.yaml               # OpenAPI route definitions
  .env.example
  eslint.config.js
  nodemon.json
  package.json
```

## Architecture

The intended request flow is:

```text
routes -> controllers -> services -> repositories -> models
```

- Routes define URL paths, route-level middleware, DTO validation where present, and controller handlers.
- Controllers translate Express request/response objects and delegate business work to services.
- Services contain business rules, orchestration, token handling, email workflows, file workflows, and repository calls.
- Repositories isolate persistence operations against Mongoose models.
- Models define stored document shape, indexes, defaults, and database validation.
- Shared middleware handles parsing, CORS, cookies, Swagger UI, 404 responses, and centralized error responses.

Known deviations:

- `health.service.js` directly checks `mongoose.connection` instead of using a data/provider abstraction.
- Some routes do not yet use DTO validation.
- Socket.IO setup exists in `src/server/sockets.js` but is not imported by `src/app.js`, so it is not active at runtime.
- The user update response currently returns the Mongoose document without excluding its password hash.

## Prerequisites

- Node.js 20.19 or newer within the 20.x line (`@faker-js/faker` 10.5.0 requires at least 20.19; the fresh-clone checks used 20.20.2).
- npm 10 or newer (`@faker-js/faker` 10.5.0 requires npm 10; the checks used npm 11.20.0).
- A running MongoDB instance.
- SMTP credentials for email flows.
- Cloudinary account credentials for avatar upload flows.
- Optional: Postman or another API client.

## Installation

1. Install the lockfile dependencies:

```bash
npm ci
```

2. Create a local environment file:

```bash
cp .env.example .env
```

On Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

3. Edit `.env` with local values.
4. Start MongoDB locally or update `DATABASE_URI` to point to an accessible MongoDB server.

The server connects to MongoDB before it begins listening. The example file supplies all validated variables, but its SMTP and Cloudinary values are placeholders; email and upload flows need working credentials.

## Environment Setup

Environment variables are loaded by `dotenv` and validated in `src/config/env.config.js` with `envalid`.

| Variable                | Current validator | Expected value                                                             | Example                                          |
| ----------------------- | ----------------- | -------------------------------------------------------------------------- | ------------------------------------------------ |
| `NODE_ENV`              | string enum       | `development`, `test`, or `production`                                     | `development`                                    |
| `PORT`                  | port              | HTTP port                                                                  | `8000`                                           |
| `FRONTEND_URL`          | url               | Frontend application URL                                                   | `http://localhost:3000`                          |
| `BACKEND_URL`           | url               | Backend base URL                                                           | `http://localhost:8000`                          |
| `DATABASE_URI`          | string            | MongoDB connection string                                                  | `mongodb://127.0.0.1:27017/mern-backend-starter` |
| `JWT_SECRET_KEY`        | string            | JWT signing secret                                                         | `dummy_jwt_secret_key_change_me`                 |
| `JWT_SHORT_EXPIRY`      | string            | Short JWT expiry accepted by `jsonwebtoken`                                | `15m`                                            |
| `JWT_LONG_EXPIRY`       | string            | Long JWT expiry accepted by `jsonwebtoken`                                 | `7d`                                             |
| `COOKIE_NAME`           | string            | Auth cookie name                                                           | `access_token`                                   |
| `COOKIE_HTTP_ONLY`      | boolean           | Whether cookie is HTTP-only                                                | `true`                                           |
| `COOKIE_SAME_SITE`      | string enum       | `strict`, `lax`, or `none`                                                 | `lax`                                            |
| `COOKIE_PATH`           | string            | Cookie path                                                                | `/`                                              |
| `COOKIE_SHORT_EXPIRY`   | string            | Milliseconds used as cookie `maxAge`                                       | `900000`                                         |
| `COOKIE_LONG_EXPIRY`    | string            | Milliseconds used as cookie `maxAge`                                       | `604800000`                                      |
| `EMAIL_HOST`            | string            | SMTP host                                                                  | `smtp.example.com`                               |
| `EMAIL_SERVICE`         | string            | Email service label; currently validated but not used by transporter setup | `example`                                        |
| `EMAIL_PORT`            | port              | SMTP port                                                                  | `587`                                            |
| `USER_EMAIL`            | string            | SMTP username/from address                                                 | `dummy@example.com`                              |
| `USER_PASSWORD`         | string            | SMTP password                                                              | `dummy_email_password`                           |
| `CLOUDINARY_CLOUD_NAME` | string            | Cloudinary cloud name                                                      | `dummy_cloud_name`                               |
| `CLOUDINARY_API_KEY`    | string            | Cloudinary API key                                                         | `dummy_api_key`                                  |
| `CLOUDINARY_API_SECRET` | string            | Cloudinary API secret                                                      | `dummy_api_secret`                               |

Important notes:

- Application code should import `env` from `#config/env.config.js` instead of reading `process.env` directly.
- Cookie expiry values are validated as strings, although Express `maxAge` expects milliseconds. Use numeric millisecond strings until the config layer is tightened.
- In `authController.signin`, `maxAge` is currently removed when setting the cookie, so remember-me duration is not applied.

## Running Locally

Start the development server with nodemon:

```bash
npm run dev
```

Start the server without nodemon:

```bash
npm start
```

With `.env.example` copied to `.env` and a reachable local MongoDB instance, `npm start` reaches the listening state under Node.js 20. Without MongoDB at `DATABASE_URI`, startup cannot reach that state. **The current Express 5 dependency is incompatible with both `xss-clean` and `express-mongo-sanitize`: every HTTP request tested returned HTTP 500** with `Cannot set property query of #<IncomingMessage> which has only a getter`. Temporarily bypassing `xss-clean` in a disposable clone exposed the same error in `express-mongo-sanitize`. The API is not usable until both middleware incompatibilities are addressed.

Configured local route targets with the provided example env (currently affected by the HTTP 500 blocker):

- Server origin: `http://localhost:8000/`
- API v1 route prefix: `http://localhost:8000/api/v1` (there is no handler at the prefix itself)
- Swagger UI: `http://localhost:8000/api-docs`
- Basic health check: `http://localhost:8000/health`

The merged-dependency smoke check returned HTTP 500 for `/`, `/health`, `/health/details`, and `/api-docs/`. In a disposable clone with both incompatible middlewares bypassed, those routes returned 404, 200, 401, and 200 respectively; the basic health response was `{"status":"success","message":"System operational"}`. The `/` handler has a separate ordering issue described below.

## Scripts

| Script                 | Command                                                        | Purpose                                                |
| ---------------------- | -------------------------------------------------------------- | ------------------------------------------------------ |
| `npm run dev`          | `nodemon src/app.js`                                           | Start local development server with automatic restart. |
| `npm start`            | `node src/app.js`                                              | Start server normally.                                 |
| `npm run lint`         | `eslint "./**/*.js"`                                           | Run ESLint against JavaScript files.                   |
| `npm run format`       | `prettier --write "./**/*.{js,jsx,html,yaml,env,md,json,txt}"` | Format supported files.                                |
| `npm run format:check` | `prettier --check "./**/*.{js,jsx,html,yaml,env,md,json,txt}"` | Check formatting without writing files.                |
| `npm test`             | `node --test`                                                  | Discover and run tests; currently discovers none.      |

## API Documentation

Swagger UI is configured at the following route, but currently returns HTTP 500 because of the middleware incompatibility:

```text
GET /api-docs
```

The OpenAPI source file is:

```text
swagger/api.swagger.yaml
```

The repository also includes:

```text
Generic Backend API.postman_collection.json
```

Implemented route groups:

- `GET /health`
- `GET /health/details`
- `/api/v1/auth`
- `/api/v1/email`
- `/api/v1/otp`
- `/api/v1/users`
- `/api/v1/notifications`

User and notification routes use `verifyAccessToken` at their mount points. `GET /health/details` also uses it; sign-out checks its cookie in the service. The remaining auth, email, OTP, and basic health routes do not require an access cookie.

## Security Notes

Current security behavior:

- JWTs are signed with `JWT_SECRET_KEY`.
- Auth token is stored in a cookie named by `COOKIE_NAME`.
- Cookie options are centralized in `src/lib/cookie.lib.js`.
- Passwords are hashed with bcryptjs.
- CORS is enabled globally.
- Request body parsing is enabled globally.
- Helmet, compression, MongoDB query sanitization, rate limiting, and XSS cleaning are enabled globally.
- Centralized error middleware returns JSON error responses.

Security gaps to address before production:

- CORS currently uses `origin: true` with credentials, which reflects arbitrary origins. Restrict this to configured allowed frontend origins.
- Only signup and sign-in use Joi DTO validation; other mutation routes lack that validation.
- Error responses include a stack trace outside production; production responses omit it.
- Cookie `maxAge` is removed on sign-in, so configured cookie duration is not enforced.
- Sign-out clears the browser cookie but does not revoke the JWT; a retained token remains valid until its expiry.
- The sign-out response currently says the token was invalidated, although only the cookie is cleared.
- CSRF protection is not implemented.
- User update does not check that the target ID matches the authenticated user, and its response can expose the user's password hash.
- Notification routes accept arbitrary user and notification IDs without an ownership check.
- The admin role guard cannot succeed with tokens issued by this application because those tokens contain only a user ID.
- Upload handling limits files to 5 MB but does not validate file contents or user ownership before storing assets.
- `xss-clean` and `express-mongo-sanitize` both try to assign to the read-only Express 5 `req.query` property. Together, they make all tested HTTP routes return 500.
- The `npm ci` audit on October 26, 2026 reported 15 dependency vulnerabilities (2 moderate, 12 high, 1 critical); reassess with `npm audit` before deployment.

## Known Issues

- Signup accepts an optional `username`; sign-in accepts either an email or a username. Username uniqueness is enforced by a sparse database index, but signup checks only for duplicate email before insertion.
- `forgotPasswordDto` exists but is not wired to `/forgot-password`.
- `/reset-password`, email routes, and OTP routes do not currently use DTO validation.
- `src/server/sockets.js` exports a Socket.IO instance, but nothing imports it during startup.
- The root `/` handler is registered after the global 404 handler, so it would be unreachable even after the middleware incompatibility is fixed.
- `src/lib/file.lib.js` uses synchronous filesystem operations.
- `userService.updateById` attempts to delete old profile pictures from a local `public` path even though uploads use Cloudinary and no `public/` folder exists.
- OTP verification does not consume a successful OTP or check its expiry directly; it can remain reusable until MongoDB's TTL cleanup removes the record.
- Health service accesses Mongoose directly.
- No tests are currently tracked, so there is no established test coverage.

## Testing

Run tests:

```bash
npm test
```

Run lint:

```bash
npm run lint
```

Run formatting check:

```bash
npm run format:check
```

No test files are tracked. On a clean clone with Node.js 20, `npm test` exits 0 but reports **0 tests**, so the successful exit does not establish test coverage.

Fresh-clone check results with Node.js 20.20.2 and npm 11.20.0:

- `npm ci`: exits 0; npm reported 15 dependency vulnerabilities in its audit output.
- `npm run lint`: exits 0.
- `npm run format:check`: exits 0.
- `npm test`: exits 0; 0 tests executed.

Current test limitations:

- The configured test command uses Node's built-in test runner, but there are no test files or mocks in the repository.
- There is no full database integration test harness.
- There is no authentication flow test that signs up, verifies, signs in, and accesses protected routes end to end.
- There is no upload test coverage.
- There is no socket test coverage.
- There is no CI configuration in the repository.

## Deployment

No deployment configuration is currently included.

Before deploying:

- Set `NODE_ENV=production`.
- Use production MongoDB, SMTP, Cloudinary, frontend, and backend values.
- Replace dummy secrets from `.env.example`.
- Restrict CORS origins.
- Review the existing security middleware and address the authorization and data exposure gaps above.
- Confirm cookie settings for HTTPS, same-site policy, domain, and lifetime.
- Confirm Swagger exposure is acceptable for the target environment.
- Add process management or platform configuration for the selected host.
- Add CI checks for lint, format, and tests.

Common production start command:

```bash
npm start
```

## Contributing

1. Keep feature code organized by module under `src/api/<feature>`.
2. Preserve the route -> controller -> service -> repository -> model boundary.
3. Do not add database calls directly in routes or controllers.
4. Add or update DTO validation for new request bodies.
5. Add tests for changed behavior.
6. Run lint, format check, and tests before submitting changes.

Recommended local verification:

```bash
npm run lint
npm run format:check
npm test
```

## License

ISC. See `LICENSE`.
