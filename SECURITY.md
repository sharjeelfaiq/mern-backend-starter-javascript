# Security Policy

Report suspected vulnerabilities privately through GitHub's **Report a vulnerability** option, if available, or a private maintainer contact. Include the affected commit, reproduction steps, and impact. No response or remediation time is guaranteed.

## Current controls and limits

Access, email verification, and password reset JWTs carry distinct purposes. Tokens without the current purpose claim must be reissued. Access cookies are HTTP-only by default (`COOKIE_HTTP_ONLY=true` in `.env.example`), have configured expiry, and use the Secure flag in production. Profile writes and notification reads/writes enforce ownership; profile updates accept only editable fields, and user API responses omit password hashes. OTP verification checks expiry and consumes the code atomically. Global request validation rejects unsafe keys and HTML markup in bodies and query strings; it runs before route parameters are populated.

`GET /metrics` requires a separate bearer token when `METRICS_TOKEN` is configured and returns 404 when it is not. It exposes route-template request counts, durations, and error totals without raw URLs, payloads, or credentials. Keep the token private and use HTTPS or a trusted private network.

If you register an error reporter (`setErrorReporter` in `src/lib/errorReporter.lib.js`), it receives the original error object, including its message and stack, plus the request method and path (with query string) for every 5xx response. Nothing is sent without a registered reporter. Review what your reporter forwards to a third party, since messages or query strings may contain user-supplied data.

The global IP rate limit is 100 requests per 15 minutes for requests that reach it, including health, docs, and metrics routes. Earlier middleware may reject unsafe requests first. This starter still needs a trusted-origin CORS policy, CSRF protection, token revocation or reset-token consumption, dedicated limits on recovery/email endpoints, and a decision on access to the user directory and user details. Sign-out only clears the cookie. The user deletion admin guard is not usable with the access tokens currently issued. `/health/details` exposes configuration status to any valid account. Treat these as deployment work before exposing the service publicly.
