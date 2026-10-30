# Contributing

Use Node.js 20.19 or later in the 20.x line (`.nvmrc` pins the version CI uses) and npm 10 or later. After cloning, run `npm ci`. Copy `.env.example` to `.env` and supply local MongoDB, SMTP, and Cloudinary settings when running the API. Tests set their own environment and do not require `.env`. Docker Compose provides MongoDB and MailDev for local development; avatar uploads still need Cloudinary credentials.

Before submitting a change, run:

```bash
npm run lint
npm run format:check
npm run typecheck
npm test
npm run test:coverage
npm audit --audit-level=high
```

The test suite uses Node's test runner. Unit tests mock repositories or run an isolated HTTP app; the database-backed HTTP integration test starts `mongodb-memory-server`, which may download a MongoDB binary on its first run. If that download is unavailable, set `MONGOMS_SYSTEM_BINARY` to a compatible local `mongod` executable. The coverage command enforces at least 80% line coverage. `npm run typecheck` type-checks `src/` through JSDoc annotations; annotate the signatures of functions you add or change in the service layer. Add focused tests for changed behavior, keep secrets out of commits and logs, and document any new environment variables in `.env.example` and the README. Update both the Swagger specification and Postman collection when changing endpoints.

## Pull requests and review

Open a pull request for every change instead of pushing to `main`, and keep each pull request to one feature or fix with the tests that pin its behavior; do not mix formatting, refactors, and features. CI must pass before merge, and another maintainer should review the change before it is merged. Note in the pull request description anything a reviewer must verify by hand, such as behavior that needs real SMTP or Cloudinary credentials.
