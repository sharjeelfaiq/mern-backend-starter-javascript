# MERN Backend Starter

Express 5 and MongoDB starter API with cookie based JWT authentication, email verification, password recovery, notifications, Cloudinary avatar uploads, and Swagger UI.

## Setup

Use Node.js 20.19 or later in the 20.x line and npm 10 or later. Copy `.env.example` to `.env`, set MongoDB, SMTP, Cloudinary, and a strong JWT secret, then run:

```bash
npm ci
npm start
```

The server connects to MongoDB before listening. API routes are under `/api/v1`; health is at `/health` and Swagger UI at `/api-docs/`.

### Docker (no external accounts)

```bash
docker compose up --build
curl http://localhost:8000/health
```

This starts the API, MongoDB, and [MailDev](https://github.com/maildev/maildev), a fake SMTP server. Verification and password reset emails appear in the MailDev inbox at http://localhost:1080. Settings come from `.env.example`; Cloudinary values are placeholders, so avatar uploads need real credentials.

## Checks

```bash
npm run lint
npm run format:check
npm test
npm run test:coverage   # runs the tests under c8 and fails below 70% line coverage (.c8rc.json)
```

Tests use `mongodb-memory-server` and may download a MongoDB binary on the first run. They set their own test environment, use port 0, and stub email delivery. The test command fails if no test succeeds. Unit tests (`test/*.service.test.js`, `test/email.lib.test.js`) mock the repositories and need no database; `test/integration.test.js` exercises the HTTP API. CI runs installation, `npm audit --audit-level=high`, lint, format check, and the tests with the coverage gate on Node 20.

## Authentication and profile behavior

Sign-in sets an HTTP-only `access_token` cookie for 15 minutes, or 7 days when `isRemembered` is true, using the durations configured in `.env`. Access, verification, and password reset JWTs have separate purposes. **Existing sessions and outstanding verification or reset links issued before this change must be reissued.**

`PATCH /api/v1/users/{id}` requires the signed-in user to own the ID. It accepts `firstName`, `lastName`, `username`, and an uploaded `avatar`. Protected fields such as `password`, `email`, and `isEmailVerified` are rejected. User list, detail, and update responses exclude password hashes. Notification listing requires ownership of `{userId}`; marking a notification read only succeeds for its owner.

OTP verification checks expiry immediately and atomically consumes a matching OTP. A code can be used once. Failed signup mail delivery removes the newly created user; failed OTP mail delivery removes the newly created OTP.

## Security notes

Global middleware rejects MongoDB operator, dotted, and prototype field names and HTML markup in request body, query, and parameters without assigning to Express 5's read-only `req.query`. Clients must still encode output when rendering text.

Before production, restrict credentialed CORS to trusted origins, add CSRF protection, and decide whether user directory and detail reads should be limited further. Sign-out clears the cookie but does not revoke a copied JWT. Password reset tokens remain valid until expiry and are not single use. The role guard on user deletion expects an admin role, but issued access tokens have no role. OTP and email endpoints need dedicated abuse limits. The `/health/details` response exposes configuration status to any valid account. Review these gaps in [SECURITY.md](SECURITY.md).

The API reference is in [swagger/api.swagger.yaml](swagger/api.swagger.yaml) and the [Postman collection](Generic%20Backend%20API.postman_collection.json).
