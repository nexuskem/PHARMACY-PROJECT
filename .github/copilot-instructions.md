# Copilot / AI Agent Instructions — MediCare Pharmacy

Quick reference for AI agents working on this repository. Focus on code that is used at runtime (backend/server.js, config/database.js, routes/*, frontend/js/*). Be conservative: only suggest edits consistent with current patterns.

## Big picture
- Backend is a **pure Node.js** API (no Express) using a tiny custom `Router` (see `backend/utils/router.js`) and raw `http` server (`backend/server.js`).
- Database is **MySQL** via `mysql2/promise`. The DB connection pool and schema creation/seeding are handled in `backend/config/database.js`.
- Frontend is static HTML + vanilla JS that talks to the API at `http://localhost:3000/api` (see `frontend/js/auth.js` for examples).

## Key files to read before changing behavior
- `backend/server.js` — registers middleware and routes; shows global error handling and how routes are attached
- `backend/utils/router.js` — custom router behavior (routes using `/path/:param` patterns; middlewares may return `false` to block requests)
- `backend/utils/request.js` — `parseBody`, `parseQuery`, `sendJSON`, and CORS handling; use `sendJSON` for consistent API responses
- `backend/config/database.js` — DB init, auto-creates DB/tables and seeds `products` when empty
- `backend/middleware/auth.js` — JWT auth semantics and role checks; middleware functions return `false` to short-circuit
- `frontend/js/*` — how the client uses APIs (localStorage keys, payload shapes, expected responses)

## Conventions & patterns (project-specific)
- API responses always use the same JSON envelope: `{ success: boolean, message: string, data?: ... }` (see `sendJSON` usages across routes).
- Auth uses JWT tokens and expects header `Authorization: Bearer <token>`; token issued for 7 days in `routes/auth.js`.
- Two user tables: `patients` (column `patient_id`) and `doctors` (column `pharmacist_id`). Be explicit when referencing `patientId` vs `pharmacistId`.
- Routes are registered with `router.get/post/put/delete('/api/...', handler)`. Parameterized paths use `:param` and are parsed by `Router` into `req.params`.
- Middleware conventions: functions used via `router.use(fn)` must return `true` to continue or `false` to stop the request (e.g., `corsHandler` or `authenticateToken`).
- Database init will create the DB/tables on first run; ensure the MySQL user has `CREATE DATABASE` privileges when running locally.
- Payment integration: M-Pesa callback endpoint `/api/mpesa/callback` expects the callback shape used by `routes/mpesa.js` (look for `Body.stkCallback`).

## Developer workflows & commands
- To run backend locally:
  - cd into `backend`
  - `npm install`
  - `npm run dev` (or `npm start`) — server listens on `process.env.PORT || 3000`
- Environment variables (optional `.env`): `PORT`, `JWT_SECRET`, `NODE_ENV`, `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`.
- Database notes:
  - Database is auto-created and seeded on first run by `backend/config/database.js`.
  - To reset: `DROP DATABASE medicare_pharmacy;` then restart the server to recreate tables and seed data.
- Scripts for maintenance exist under `backend/scripts/` (e.g., `create-pharmacist.js`, migration helpers). Use them for one-off changes.

## Code change guidance (PR suggestions)
- Use existing utilities: prefer `sendJSON(res, status, payload)` for responses, `db.getDb()` for DB access, and `authenticateToken` when adding protected routes.
- Maintain the current response envelope; do not return raw objects directly from handlers.
- When adding new DB tables/columns, update `backend/config/database.js` so the system can create them for fresh installs and preserve existing data.
- Be careful changing table names or columns — many handlers depend on `patients` vs `doctors` and specific column names like `patient_id`/`pharmacist_id`.

## Useful examples (copyable snippets)
- Protected route example:

  router.get('/api/me', async (req, res) => {
    const ok = await authenticateToken(req, res); if (!ok) return;
    // use db.getDb() and sendJSON
  });

- Parsing request body: server middleware sets `req.body` using `parseBody()` — handlers can assume `req.body` exists for POST/PUT.

## Where to look for tests or CI changes
- There are currently **no tests or CI config** in the repo. If adding tests, target the `backend/` unit tests for route handlers and `config/database.js` (use a disposable DB or a mock). Document any new scripts in `backend/package.json`.

## Safety & assumptions
- This project stores password hashes using `bcryptjs` and signs JWTs with `jsonwebtoken`. Avoid suggesting changes that would break current token shapes without migration steps.
- The project is designed to run locally with minimal setup; prefer small, incremental changes and include migration steps for DB changes.

---
If you'd like, I can: (1) open a short PR adding this file, (2) convert any of the notes above into inline code comments, or (3) expand the docs with a troubleshooting section (DB permission fixes, common errors). Tell me which you prefer or what to clarify.✅
