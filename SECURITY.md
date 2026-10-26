# Security Policy

Report suspected vulnerabilities privately through GitHub's **Report a vulnerability** option, if available, or a private maintainer contact. Include the affected commit, reproduction steps, and impact. No response or remediation time is guaranteed.

## Current controls and limits

Access, email verification, and password reset JWTs carry distinct purposes. Existing sessions and outstanding verification/reset links from older versions must be reissued. Cookies are HTTP-only with configured expiry and secure in production. Profile writes and notification reads/writes enforce ownership; profile updates accept only editable fields, and user API responses omit password hashes. OTP verification checks expiry and consumes the code atomically.

This starter still needs a trusted-origin CORS policy, CSRF protection, token revocation or reset-token consumption, dedicated limits on recovery/email endpoints, and a decision on access to the user directory and user details. Sign-out only clears the cookie. The user deletion admin guard is not usable with the access tokens currently issued. Treat these as deployment work before exposing the service publicly.
