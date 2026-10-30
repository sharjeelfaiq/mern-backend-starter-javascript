# Changelog

## Unreleased

- Fixed `validateDto` letting requests without a parsed JSON body through to controllers, which answered 500; they now get 400 (`Validation failed: ...`). Swagger documents the 400 on sign-in.
- Fixed a latent `TypeError` in `connectDatabase`: the "already connected" and "disconnected" log messages use `colors` string getters, but `colors` was never imported.
- Removed the `sendTimeout` nodemailer option, which nodemailer does not support and ignored.
- Added an optional error reporter hook (`setErrorReporter` in `src/lib/errorReporter.lib.js`) invoked for HTTP 5xx responses, plus the optional `ERROR_TRACKING_DSN` setting passed to it. Nothing is sent unless a reporter is registered.
- Added `npm run typecheck` (`jsconfig.json`, `checkJs`, non-strict) with JSDoc signatures for the auth and user services, and a CI step.
- CI now reads the Node version from `.nvmrc` (20.19.0), caches by `package-lock.json`, and a weekly `dep-check` workflow reports outdated packages and audit results.
- Raised the coverage gate to 80% line coverage and added unit tests for the notification, OTP, and user repositories, `file`, `token`, `cookie`, `otp`, `metrics`, `database`, and `errorReporter` libs, the validation middleware, and the health and email services.
- Added a CONTRIBUTING section on pull requests and review.
- Added restricted in-process request and error metrics with operator access documentation.
- Expanded tests for notification service behavior, OTP verification, user controllers, global request validation, and metrics.
- Added contributor setup and verification guidance.
- Corrected the API description, security notes, Swagger operations, and Postman examples to match current routes and validation.
