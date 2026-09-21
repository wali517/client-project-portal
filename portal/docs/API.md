# API Reference

Base URL: `http://localhost:5000/api`

All responses share one shape.

**Success**
```json
{ "success": true, "message": "Projects loaded", "data": [], "pagination": { "page": 1, "limit": 10, "total": 42, "totalPages": 5 } }
```
`pagination` is present only on list endpoints.

**Error**
```json
{ "success": false, "message": "Validation failed", "errors": [{ "field": "email", "message": "Enter a valid email address" }] }
```

## Authentication

Send the token from `POST /auth/login` on every protected call:

```
Authorization: Bearer <token>
```

File downloads also accept `?token=<token>` so a link can be opened directly in a browser tab.

## Status codes

| Code | Meaning |
| --- | --- |
| 200 | OK |
| 201 | Created |
| 400 | Bad request — invalid status transition, bad payload |
| 401 | Missing, invalid or expired token; deactivated account |
| 403 | Authenticated but not permitted (wrong role or not your record) |
| 404 | Not found |
| 409 | Conflict — duplicate email, request already converted, staff already assigned |
| 422 | Validation failed |
| 429 | Rate limit exceeded |
| 500 | Server error |

## Roles and permissions

Permissions are defined in `src/constants/permissions.js` and granted per role.

| Permission | Admin | Staff | Client |
| --- | :-: | :-: | :-: |
| `user:read` | ✓ | ✓ | |
| `user:write`, `user:delete` | ✓ | | |
| `request:create` | | | ✓ |
| `request:read` | ✓ | | ✓ |
| `request:update` | ✓ | | ✓ |
| `request:review`, `request:convert` | ✓ | | |
| `project:read` | ✓ | ✓ | ✓ |
| `project:create`, `project:update`, `project:assign`, `project:cancel` | ✓ | | |
| `project:status`, `project:progress` | ✓ | ✓ | |
| `project:submit` | | ✓ | |
| `project:review` | ✓ | | |
| `project:client-review` | | | ✓ |
| `project:revision` | ✓ | | ✓ |
| `file:upload`, `file:read`, `file:delete` | ✓ | ✓ | ✓ |
| `message:read`, `message:send` | ✓ | ✓ | ✓ |
| `activity:read` | ✓ | ✓ | ✓ |
| `activity:read-all` | ✓ | | |

Permission alone is not enough: clients are scoped to their own records and staff to projects they
are actively assigned to.

## Enums

**Request status** — `NEW`, `UNDER_REVIEW`, `APPROVED`, `REJECTED`, `CONVERTED_TO_PROJECT`, `CLOSED`

**Project status** — `NOT_STARTED`, `ASSIGNED`, `IN_PROGRESS`, `WAITING_FOR_CLIENT`, `UNDER_REVIEW`,
`REVISION_REQUIRED`, `COMPLETED`, `CANCELLED`

**Priority** — `LOW`, `MEDIUM`, `HIGH`, `URGENT`

**Service type** — `WEB_DEVELOPMENT`, `MOBILE_APP`, `UI_UX_DESIGN`, `GRAPHIC_DESIGN`,
`CONTENT_WRITING`, `SEO`, `DIGITAL_MARKETING`, `CONSULTING`, `MAINTENANCE`, `OTHER`

**File category** — `REQUEST_ATTACHMENT`, `PROJECT_ATTACHMENT`, `DELIVERABLE`, `MESSAGE_ATTACHMENT`

## Common list parameters

| Param | Notes |
| --- | --- |
| `page` | default `1` |
| `limit` | default `10`, max `100` |
| `search` | case-insensitive across the resource's text fields |
| `sortBy` | e.g. `-createdAt`, `deadline`; only whitelisted fields are accepted |
| `status`, `priority`, `serviceType` | enum filters |
| `dateFrom`, `dateTo` | ISO dates, filter on `createdAt` |

---

# Endpoints

## Health

### `GET /health`
No auth. Returns uptime.

---

## Auth — `/auth`

### `POST /auth/login`
```json
{ "email": "admin@portal.test", "password": "Admin@12345" }
```
→ `200` `{ data: { token, user } }`. `401` for bad credentials or a deactivated account. Rate limited.

### `POST /auth/logout`
Auth required. `200`.

### `GET /auth/me`
Auth required. → `{ data: { user } }`

### `PATCH /auth/me`
Body: any of `name`, `phone`, `company`, `avatar`. → updated user.

### `POST /auth/change-password`
```json
{ "currentPassword": "...", "newPassword": "..." }
```
`401` if the current password is wrong.

### `POST /auth/forgot-password`
```json
{ "email": "someone@example.com" }
```
Always `200` — the response does not reveal whether the account exists. Emails a reset link, or logs
it to the console when SMTP is unconfigured.

### `POST /auth/reset-password`
```json
{ "token": "<from the email>", "password": "NewPass@123" }
```
`400` if the token is invalid or expired.

---

## Users — `/users` (admin, except `GET` which staff may also call)

| Method | Path | Notes |
| --- | --- | --- |
| `GET` | `/users` | Filters: `role`, `isActive` (`"true"`/`"false"`), `search` |
| `GET` | `/users/:id` | |
| `POST` | `/users` | `name`, `email`, `password`, `role`, optional `phone`, `company`, `isActive`. `409` on duplicate email |
| `PATCH` | `/users/:id` | Any subset of the above. Send `isActive: true` to reactivate |
| `DELETE` | `/users/:id` | Deactivates — the record is kept |
| `DELETE` | `/users/:id/permanent` | Permanently deletes the account. `409` if the person still has request/project/assignment history — deactivate instead |

Passwords are never returned.

---

## Requests — `/requests`

### `POST /requests` — client
```json
{
  "title": "Rebuild the product catalogue",
  "description": "At least ten characters of detail.",
  "serviceType": "WEB_DEVELOPMENT",
  "priority": "HIGH",
  "deadline": "2026-11-30",
  "budget": 8000,
  "instructions": "Optional."
}
```
→ `201`, with a generated `requestNumber` (`REQ-2026-000001`) and status `NEW`.

### `GET /requests`
Admins see everything; clients see only their own. Extra filter: `client` (admin only).

### `GET /requests/:id`
→ `{ data: { request, files } }`. `403` for another client's request.

### `PATCH /requests/:id` — client
Editable only while the request is `NEW` or `UNDER_REVIEW`.

### `DELETE /requests/:id` — admin
Permanently deletes the request along with its attachments (including the stored files on
disk) and its messages. `409` if the request was already converted into a project — delete
the project instead, which reopens the request as `APPROVED`.

### `POST /requests/:id/review` — admin
```json
{ "status": "UNDER_REVIEW", "note": "optional" }
```
Invalid transitions return `400`.

### `POST /requests/:id/approve` — admin
Optional `note`. → status `APPROVED`.

### `POST /requests/:id/reject` — admin
```json
{ "reason": "At least five characters, shown to the client." }
```

### `POST /requests/:id/notes` — admin
```json
{ "note": "Internal note." }
```

### `POST /requests/:id/convert` — admin
Only from `APPROVED`. All fields optional — anything omitted is copied from the request.
```json
{ "deadline": "2026-12-15", "budget": 9500, "staffIds": ["<userId>"] }
```
→ `201` with the new project. Request attachments are copied across and the request becomes
`CONVERTED_TO_PROJECT`. A second attempt returns `409`.

### `GET /requests/:id/activity`
### `GET /requests/:id/messages`
### `POST /requests/:id/messages`
```json
{ "message": "text", "attachments": ["<fileId>"] }
```

---

## Projects — `/projects`

### `POST /projects` — admin
```json
{
  "client": "<userId>",
  "title": "…", "description": "…",
  "serviceType": "UI_UX_DESIGN",
  "priority": "MEDIUM",
  "deadline": "2026-12-01",
  "budget": 5000
}
```
`400` if the client id is not an active client account.

### `GET /projects`
Scoped by role. Admin-only extra filters: `client`, `staff`. Also `deadlineBefore`.
Each project includes its active `assignments` with populated staff.

### `GET /projects/:id`
→ `{ data: { project, assignments, files, revisions } }`

### `PATCH /projects/:id` — admin
Title, description, service, priority, deadline, budget, instructions.

### `DELETE /projects/:id` — admin
Permanently deletes the project and cascades to its files (including the stored bytes on
disk), messages, revisions and staff assignments. If the project came from a request, the
request's `convertedProject` link is cleared and its status reverts to `APPROVED` so it can
be converted again.

### `PATCH /projects/:id/status` — admin, staff
```json
{ "status": "IN_PROGRESS", "note": "optional" }
```
Validated against `PROJECT_STATUS_FLOW` and against the statuses the caller's role may set.

### `PATCH /projects/:id/progress` — admin, staff
```json
{ "progress": 60 }
```
Integer 0–100.

### `POST /projects/:id/assign` — admin
```json
{ "staffIds": ["<userId>", "<userId>"] }
```
→ `201`. Moves a `NOT_STARTED` project to `ASSIGNED`. Re-assigning someone already active is a no-op.

### `DELETE /projects/:id/assign/:staffId` — admin

### `POST /projects/:id/submit` — assigned staff
```json
{ "note": "optional" }
```
From `IN_PROGRESS`, `REVISION_REQUIRED` or `WAITING_FOR_CLIENT` → `UNDER_REVIEW`. Any open revision
is marked resolved.

### `POST /projects/:id/review` — admin
```json
{ "decision": "APPROVE" }
```
or
```json
{ "decision": "REQUEST_REVISION", "reason": "at least 5 characters", "instructions": "optional" }
```
Approve → `WAITING_FOR_CLIENT`. Request revision → `REVISION_REQUIRED` and a `Revision` record.

### `GET /projects/:id/revisions`
### `POST /projects/:id/revisions` — admin, client  *(alias: `POST /projects/:id/revision`)*
```json
{ "reason": "at least 5 characters", "instructions": "optional" }
```

### `POST /projects/:id/approve` — client
```json
{ "feedback": "optional" }
```
Only from `WAITING_FOR_CLIENT` → `COMPLETED`, progress set to 100. Another client's project → `403`.

### `POST /projects/:id/feedback` — client
```json
{ "feedback": "required, 1–2000 characters" }
```

### `POST /projects/:id/cancel` — admin
```json
{ "reason": "optional" }
```

### `GET /projects/:id/activity`
### `GET /projects/:id/messages`
### `POST /projects/:id/messages`

---

## Files — `/files`

### `POST /files/upload`
`multipart/form-data`:

| Field | Notes |
| --- | --- |
| `files` | One or more files |
| `requestId` or `projectId` | The record to attach to |
| `category` | See the file category enum |

Filenames are generated server side. Allowed types: images, PDF, Office documents, plain text and
archives. Size cap from `MAX_FILE_SIZE_MB` (default 15MB); oversize or disallowed types → `400`.
Re-uploading the same original name against the same record increments `version`.

### `GET /files`
Query: `requestId`, `projectId`, `category`.

### `GET /files/:id`
Metadata only.

### `GET /files/:id/download`
Streams the file with its original name. Accepts `Authorization` or `?token=`. `403` if the caller
cannot see the parent record.

### `DELETE /files/:id`
Soft delete. Uploader or admin only.

---

## Activity — `/activity` (admin)

### `GET /activity`
Global audit trail. Filters: `action`, `user`, `project`, `request`, plus pagination.
Each entry carries the actor, role, action, and `previousValue` / `newValue`.

Non-admins use the scoped feeds on `/requests/:id/activity` and `/projects/:id/activity`.

---

## Dashboard — `/dashboard`

### `GET /dashboard`
One endpoint, shaped by the caller's role.

**Admin** — `stats` (`totalClients`, `totalStaff`, `newRequests`, `requestsUnderReview`,
`activeProjects`, `projectsUnderReview`, `revisionRequired`, `completedProjects`), `recentRequests`,
`recentProjects`, `activity`.

**Staff** — `stats` (`assigned`, `inProgress`, `awaitingReview`, `revisionRequired`, `completed`),
`upcomingDeadlines`, `recentProjects`, `activity` — all scoped to assigned projects.

**Client** — `stats` (`submitted`, `pending`, `approved`, `activeProjects`, `awaitingReview`,
`completed`), `recentRequests`, `recentProjects`, `activity` — all scoped to the client's own records.
