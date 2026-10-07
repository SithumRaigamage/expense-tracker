# 🔴 Critical — Security

Both issues can be exploited by **any registered user** with nothing more than
the normal UI or a single HTTP request.

---

## C1 — Any user can grant themselves the `admin` role

| | |
|---|---|
| **Severity** | 🔴 Critical — privilege escalation (CWE-269, CWE-915) |
| **Verification** | Reproduced |
| **Status** | ✅ Fixed |
| **Location** | `expensive-tracker-backend/src/services/userService.js` (`updateProfile`), `expensive-tracker-backend/src/controllers/profileController.js` (`uploadProfileImage`), `expensive-tracker-frontend/src/app/Navigation/components/settings/profile/profile.component.html` |

### Description

The `role` field on `User` does two jobs. Authorization reads it
(`adminOnly` checks `role === 'admin'`). The profile page also presents it as a
free-text **"Role/Occupation"** input with the placeholder *"e.g. Software
Engineer"*. Both `PUT /api/v1/users/profile` and
`POST /api/v1/users/profile/image` copy `role` from the request body onto the
user.

### Impact

A user types `admin` into the Occupation box and saves. They can then:

- read every user's feedback, including names and email addresses
  (`GET /api/v1/feedback/all`)
- create, edit and delete the release notes every user sees

### Reproduction

```http
PUT /api/v1/users/profile
Cookie: token=<any user's session>
Content-Type: application/json

{ "role": "admin" }
```

The response shows `"role": "admin"`, and `GET /api/v1/feedback/all` returns `200`.

### Remediation

1. Split the two meanings. Add a free-text `occupation` field for the job title
   users actually want to show. Restrict `role` to the `USER_ROLES` enum.
2. Never accept `role` from any user-facing endpoint. Roles are granted
   out-of-band only (seed script or direct database change).
3. Move existing free-text `role` values into `occupation` with a one-off
   migration, and list current admins so an operator can review them. **Any
   account that self-escalated before the fix keeps admin until reviewed.**

### Resolution

- `User.role` is now an enum (`user` | `admin`). A new free-text `occupation`
  field holds the job title, and the profile page's input is relabelled
  **Occupation** and bound to it.
- Neither `PUT /users/profile` nor `POST /users/profile/image` reads `role` any more.
- Migration: `npm run migrate:roles` (`scripts/migrateUserRoles.js`). It moves
  legacy free-text roles into `occupation` and **prints every admin account for
  manual review**. It is idempotent and supports `--dry-run`.
- Regression tests: `tests/integration/security.test.js` → *C1*. They were
  confirmed to fail on the pre-fix code (5 ✕) and pass after (5 ✓).

> **Operator action on deploy:** run `npm run migrate:roles` and demote any admin
> in the printed list that shouldn't be one. Until the migration runs, users
> with a legacy free-text role can't save documents that re-validate the role
> (for example, changing their password).

---

## C2 — Arbitrary file deletion via `profileImage` path traversal

| | |
|---|---|
| **Severity** | 🔴 Critical — path traversal leading to arbitrary file deletion (CWE-22) |
| **Verification** | Reproduced |
| **Status** | ✅ Fixed |
| **Location** | `expensive-tracker-backend/src/controllers/profileController.js` (`deleteProfileImage`), `expensive-tracker-backend/src/services/userService.js` (`updateProfile`) |

### Description

`PUT /users/profile` accepts `profileImage` (and `avatar`) as arbitrary strings.
`DELETE /users/profile/image` takes everything after `/uploads/` in the stored
value, joins it onto the upload directory and calls `fs.unlinkSync` on the
result. `..` segments are never rejected.

### Impact

Any user can delete any file the Node process can write to: `.env`, the
application source, other users' uploads and log files. This can take the
service down (a deleted `.env` or source file breaks the next restart) or
destroy data.

### Reproduction

```http
PUT /api/v1/users/profile
{ "profileImage": "http://x/uploads/../../.env" }

DELETE /api/v1/users/profile/image
```

During verification, a canary file outside the uploads directory was deleted.

### Remediation

1. Stop accepting `profileImage` / `avatar` from the profile endpoint. Only the
   upload endpoint may set them, and only to a server-generated filename.
2. When deleting, reduce the stored value to `path.basename()`. Resolve it
   against the absolute upload directory and refuse unless the result stays
   inside that directory.
3. Delete the previous image when a new one is uploaded, so replaced files
   don't pile up.

### Resolution

- New `src/config/storage.js` resolves the upload directories once, as absolute
  paths. Its `resolveInside()` keeps only the final path segment and verifies
  the result stays inside the directory.
- The profile endpoint no longer accepts `profileImage` or `avatar`. Uploads
  store a server-generated name (`<userId>-<uuid>.<ext>`) as a root-relative
  `/uploads/...` URL.
- Delete uses `resolveInside()`. Uploading a new picture removes the old file.
  A failed profile update removes the file it just wrote.
- Upload rejections (wrong type, too large) now return 400 instead of 500.
- Regression tests: *C2* and *resolveInside*. One of them plants a traversal
  path directly in the database and confirms the canary file survives.

