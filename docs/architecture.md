# Backend Architecture

This backend uses a layered Express architecture. Each request should move in one direction through the stack:

```text
routes -> controllers -> services -> repositories -> models
```

## Layer Responsibilities

### Routes

Routes declare HTTP paths, HTTP methods, request validators, upload middleware, authentication middleware, and the controller that handles the request.

Routes must not contain inline handlers, database calls, business decisions, token logic, file processing, or response payload construction.

### Controllers

Controllers translate HTTP input and output. They may read `req.body`, `req.params`, `req.query`, `req.cookies`, and `req.files`, call exactly the appropriate service operation, and write the HTTP response.

Controllers must not query models or repositories directly. They must not implement business rules, persistence decisions, password/token verification, email composition, OTP validation, or file lifecycle decisions.

### Services

Services own business logic. This includes validation that depends on current state, authentication decisions, password hashing/comparison, token generation/verification, email workflows, OTP workflows, file metadata decisions, and orchestration across repositories or shared libraries.

Services should use repositories for persistence and shared libraries for infrastructure integrations.

### Repositories

Repositories are the data-access boundary. They wrap database operations and expose persistence-focused methods to services.

Repositories should not contain HTTP logic, request/response handling, business workflow orchestration, or calls to controllers/services.

### Models

Models define persistence shape and database-level constraints only. Keep schemas focused on stored fields, indexes, references, defaults, and database validation.

Models must not import routes, controllers, services, repositories, middleware, or application libraries.

## Enforcement

Run the architecture guard before merging structural changes:

```bash
npm run lint:architecture
```

The guard fails when:

- A route file contains an inline Express handler.
- A route imports services, repositories, models, libraries, or config directly.
- A controller imports repositories, models, routes, or middleware.
- A service imports routes, controllers, middleware, or models directly.
- A repository imports anything outside the model layer.
- A model imports any internal application layer.

General linting remains separate:

```bash
npm run lint
```
