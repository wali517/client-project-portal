# Client & Project Management Portal

A full-stack MERN portal where clients submit work requests, admins review and convert them into
projects, staff deliver the work, and every step is reviewed and recorded.

- **Frontend** — React 18 + Vite + Tailwind CSS, mobile-first, role-aware routing
- **Backend** — Node.js + Express + MongoDB (Mongoose), JWT auth, permission-based access control
- **Roles** — `ADMIN`, `STAFF`, `CLIENT`

---

## 1. Requirements

| Tool | Version |
| --- | --- |
| Node.js | 18 or newer |
| npm | 9 or newer |
| MongoDB | 6 or newer, running locally or a connection string to Atlas |

---

## 2. Setup

```bash
# 1. Backend
cd backend
cp .env.example .env          # then edit JWT_SECRET and MONGO_URI
npm install
npm run seed                  # creates demo accounts and sample data
npm run dev                   # http://localhost:5000

# 2. Frontend (new terminal)
cd frontend
cp .env.example .env          # VITE_API_URL defaults to http://localhost:5000/api
npm install
npm run dev                   # http://localhost:5173
```

### Seeded demo accounts

| Role | Email | Password |
| --- | --- | --- |
| Admin | `admin@portal.test` | `Admin@12345` |
| Staff | `staff@portal.test` | `Staff@12345` |
| Client | `client@portal.test` | `Client@12345` |

`npm run seed -- --fresh` wipes the collections first. The admin credentials can be overridden with
`SEED_ADMIN_EMAIL` and `SEED_ADMIN_PASSWORD`.

### Environment variables (backend)

| Variable | Purpose |
| --- | --- |
| `PORT` | API port (default `5000`) |
| `NODE_ENV` | `development` / `production` / `test` |
| `MONGO_URI` | MongoDB connection string |
| `JWT_SECRET` | Signing secret — the server refuses to boot in production if left at the default |
| `JWT_EXPIRES_IN` | Token lifetime (default `7d`) |
| `PASSWORD_RESET_EXPIRES_MIN` | Reset-token lifetime in minutes |
| `CLIENT_URL` | Allowed CORS origin and base for reset links |
| `STORAGE_DRIVER` | `local` today; the storage layer is swappable (see §6) |
| `UPLOAD_DIR` | Where uploaded files are written |
| `MAX_FILE_SIZE_MB` | Per-file upload limit |
| `RATE_LIMIT_*`, `AUTH_RATE_LIMIT_MAX` | Throttling |
| `SMTP_*` | Optional. With SMTP unset, password-reset links are printed to the server console |

Frontend uses a single variable, `VITE_API_URL`.

---

## 3. Project structure

```
portal/
├── backend/
│   ├── scripts/seed.js
│   ├── src/
│   │   ├── config/        env + database connection
│   │   ├── constants/     roles, statuses, permissions, activity actions
│   │   ├── controllers/   thin HTTP layer
│   │   ├── middleware/    authenticate, authorize, validate, upload, errors, rate limits
│   │   ├── models/        User, Request, Project, ProjectAssignment, File, Message,
│   │   │                  Revision, ActivityLog, Counter
│   │   ├── routes/        one router per resource
│   │   ├── services/      all business logic
│   │   ├── utils/         ApiError, responses, pagination, ids
│   │   └── validators/    zod schemas per resource
│   └── tests/             Jest + Supertest integration tests
├── frontend/
│   └── src/
│       ├── api/           one module per resource, axios instance with auth interceptor
│       ├── components/    ui/ layout/ requests/ projects/ files/ messaging/ activity/ users/
│       ├── constants/     mirrors backend enums + navigation
│       ├── context/       AuthContext
│       ├── hooks/         useAuth, useFetch, usePaginatedList, useDebounce
│       ├── layouts/       AuthLayout, DashboardLayout
│       ├── pages/         auth/ admin/ staff/ client/
│       ├── routes/        ProtectedRoute, RoleRoute, AppRoutes
│       └── utils/         formatting, permissions, error parsing
└── docs/API.md
```

Files are kept small and single-purpose: controllers only translate HTTP, services hold the rules,
and React pages compose shared components rather than repeating markup.

---

## 4. Data model (ERD)

```
User ──────< Request >──────── converted to ─────> Project
 │  (client)                                        │
 │                                                  ├──< ProjectAssignment >── User (staff)
 │                                                  ├──< Revision
 ├──< Message (project | request)                   ├──< File
 ├──< File (uploadedBy)                             └──< ActivityLog
 └──< ActivityLog (user)

Counter  — atomic sequence source for REQ-YYYY-000001 / PRJ-YYYY-000001
```

| Collection | Key fields |
| --- | --- |
| `users` | name, email (unique), password (bcrypt), role, phone, company, isActive, lastLogin, reset-token fields |
| `requests` | requestNumber, client, title, description, serviceType, priority, deadline, budget, instructions, status, adminNotes[], rejectionReason, convertedProject |
| `projects` | projectNumber, client, request, title, description, serviceType, priority, deadline, budget, status, progress, clientFeedback, cancellationReason, createdBy |
| `projectassignments` | project, staff, assignedBy, status — unique on (project, staff) |
| `revisions` | project, requestedBy, reason, instructions, status, resolvedAt |
| `files` | originalName, storedName, mimeType, size, category, request/project, uploadedBy, version, isDeleted |
| `messages` | sender, project or request, message, attachments[], readBy[] |
| `activitylogs` | user, role, request/project/targetUser, action, previousValue, newValue, metadata |

Indexes cover email, the two generated numbers, status, client, staff, and `createdAt` for the
sorted, filtered list endpoints.

---

## 5. Workflow

```
CLIENT submits request                     → REQUEST: NEW
ADMIN opens it                             → UNDER_REVIEW
ADMIN approves (or rejects with a reason)  → APPROVED / REJECTED
ADMIN converts approved request            → CONVERTED_TO_PROJECT + PROJECT: NOT_STARTED
ADMIN assigns staff                        → ASSIGNED
STAFF works, updates progress              → IN_PROGRESS
STAFF submits deliverables                 → UNDER_REVIEW
ADMIN approves                             → WAITING_FOR_CLIENT
ADMIN requests revision                    → REVISION_REQUIRED  ─┐
CLIENT approves                            → COMPLETED           │ back to staff
CLIENT requests changes                    → REVISION_REQUIRED  ─┘
ADMIN cancels at any point                 → CANCELLED
```

Every transition is checked against `PROJECT_STATUS_FLOW` server side, and each role may only set
the statuses listed in `PROJECT_STATUS_BY_ROLE`. The frontend hides invalid options as a
convenience; the API is the authority.

---

## 6. Access control

Permissions are declared once in `backend/src/constants/permissions.js` and granted per role. Routes
reference permission names (`project:submit`), never role strings, so the rules can change without
touching business logic. On top of that, `access.service.js` enforces ownership:

- Clients only ever see their own requests, projects, files and messages.
- Staff only see projects they hold an active assignment on.
- Admins see everything.

Other protections: bcrypt password hashing, JWT with an `isActive` check on every request, zod
validation on body/query/params, helmet, CORS pinned to `CLIENT_URL`, global and auth-specific rate
limits, server-generated upload filenames with a MIME whitelist and size cap, and no password-reset
account enumeration.

File storage goes through a provider interface (`services/storage/`), so swapping the local disk
driver for S3 means adding one module and changing `STORAGE_DRIVER` — nothing else moves.

---

## 7. Activity logging

`activity.service.js` records every meaningful action (status changes, assignments, uploads,
messages, approvals, revisions, account changes) with the actor, the role, and the before/after
values. Logging never throws: a failed write cannot break the operation that triggered it. The feed
appears on each request and project, and admins get a global, filterable audit trail at
`/admin/activity`.

---

## 8. Tests

```bash
cd backend
npm test
```

Jest + Supertest run against an in-memory MongoDB. Coverage includes password hashing, login and
inactive-account handling, cross-role and cross-client access denial, the full request lifecycle
(create → review → approve → convert, plus duplicate-conversion conflicts), pagination/search/filter,
project assignment and the complete submit → revision → resubmit → admin approve → client approve
flow, file upload/download permissions and MIME rejection, and messaging permissions.

> **Note:** these tests were written but could not be executed in the environment this project was
> generated in — `mongodb-memory-server` downloads a MongoDB binary on first run, and that download
> was blocked by the sandbox network policy. Run them locally. If you already have a `mongod`
> running, `MONGO_TEST_URI=mongodb://127.0.0.1:27017/cpm_portal_test npm test` skips the download.

The frontend production build (`cd frontend && npm run build`) completes cleanly.

---

## 9. API

Full endpoint reference, request/response shapes and error codes: [`docs/API.md`](docs/API.md).

---

## 10. Assumptions

These were not specified, so a decision was made and documented rather than left ambiguous:

1. **Only admins create accounts.** There is no public signup — a client or staff member receives
   credentials from an admin. The seed script creates the first admin.
2. **Approving a request does not create the project.** Approval and conversion are separate steps,
   so an admin can approve and then set the budget, deadline and team when converting.
3. **A request converts once.** A second attempt returns `409`.
4. **Deactivation instead of deletion.** Users are deactivated (blocked from signing in, history
   preserved) rather than removed. Files are soft-deleted for the same reason.
5. **File versioning by name.** Re-uploading a file with the same original name against the same
   record increments `version` rather than overwriting.
6. **Messaging is a shared thread** per request and per project, visible to everyone with access to
   that record — not private one-to-one chat.
7. **Progress is manual.** Staff and admins set the percentage; it is not derived from status.
8. **Currency is USD** for display formatting only; the stored budget is a plain number.
9. **Auth tokens live in `localStorage`.** Simple and adequate for this scope; a production
   deployment handling sensitive data should move to httpOnly cookies with CSRF protection.
10. **Notifications are email-only and optional.** With SMTP unconfigured, reset links are logged to
    the server console so the flow can be exercised without a mail provider.
