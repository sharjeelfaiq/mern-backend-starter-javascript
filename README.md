# MERN Backend Starter

Layered Node.js and Express backend starter using ES modules, MongoDB via Mongoose, centralized configuration, shared middleware, and feature-oriented API modules.

## Architecture

Requests flow through:

```text
routes -> controllers -> services -> repositories -> models
```

- Routes declare paths, validators, upload/auth middleware, and controller handlers.
- Controllers translate HTTP input/output and delegate business work to services.
- Services own business rules, orchestration, token/email/file workflows, and repository calls.
- Repositories isolate persistence operations.
- Models define stored shape, indexes, defaults, and database validation.

## Scripts

```bash
npm run dev
npm start
npm run lint
npm run format
npm run format:check
npm test
```

## Configuration

Copy `.env.example` to `.env` and provide environment-specific values. Runtime configuration is validated in `src/config/env.config.js`; application code should import `env` from that module instead of reading `process.env` directly.

## Project Structure

```text
src/
  api/
    auth/
    email/
    health/
    notification/
    otp/
    user/
  config/
  lib/
  middlewares/
  server/
  views/
tests/
  integration/
  unit/
```
