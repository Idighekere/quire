# Drive upload / sync: bottlenecks, tradeoffs, options

Scope: the three file-ingestion paths — (A) direct upload via the app,
(B) manual adds in the Drive UI, (C) the sync walk that imports Drive into the DB.
References are to the current `usequire` tree.

## Ground facts (established by debugging, not assumed)

- All Drive access runs as the library admin's Google account via OAuth
  (`driveServiceForAdmin()`). Uploads and sync share the same token and the same
  root folder (`GOOGLE_DRIVE_ROOT_FOLDER_ID`).
- OAuth scope is `drive.file` only
  (`server/src/controllers/auth.controllers.ts:120`).
  Under `drive.file`, **every listing call returns only files/folders the app
  itself created or the user explicitly opened with the app.** Hand-made folders
  and files are invisible to `files.list`, even when they sit inside the exact
  root folder, owned by the exact account, at the exact ID in the env.
  Proven by `GET /sync/debug`: `childNames: []` on a root the Drive UI showed
  as non-empty.
- Google has **no folder-scoped OAuth**. Listing visibility cannot be limited to
  "just the library folder" on a personal account. The choice is binary: stay
  blind to manual files, or broaden the scope account-wide.
- Drive allows same-name sibling folders. First match wins everywhere.
- Deleting an app-created folder orphans the book records pointing at its file
  IDs. Drive Trash (30 days) restores them; emptied trash means re-upload.
- Sync dedupes by Drive file ID (`already in the library` skip). Re-syncing an
  app-uploaded file is correctly a no-op, not a bug.

---

## Case A — Direct upload via the app

How it works: browser POSTs multipart to `/upload/book`, the API resolves the
`{Level}/{Semester}/{CODE - Title}` folder path, uploads the buffer to Drive as
the admin, stores the returned file ID on the book
(`server/src/controllers/upload.controllers.ts`, `DriveService.uploadFile`).

Bottlenecks:

1. **Two legs, one progress signal.** Leg 1 (browser to API) reports real
   `onUploadProgress` bytes. Leg 2 (API to Google) happens before the response
   and has no progress channel, so the bar used to park at a stuck 100%.
   Mitigated in the client with a two-phase indicator (determinate % for leg 1,
   indeterminate "Saving to library Drive…" for leg 2). True end-to-end percent
   would need server streaming or pollable job state — deliberately not built.
2. **Folder resolution is listing-based.** `ensureCoursePath`
   (`server/src/services/drive.service.ts`) lists children at each level and
   matches tolerantly (`300L`/`300`/`300 Level`, `1st`/`First`, normalized code
   with `UUY-`/space/case variants). Anything the listing cannot see can never
   match, so uploads next to invisible manual folders create parallel canonical
   folders. Tolerant matching fixes naming drift, not scope blindness.
3. **One admin token is a single point of failure.** Uploads 503 until an admin
   completes the `?drive=1` consent flow once; token expiry/revocation pauses
   all uploads.

Options and drawbacks:

| Option | Gain | Drawback |
|---|---|---|
| Keep `ensureCoursePath` (current) | Reuses hand-made folders when visible; no schema change | Cannot see manual folders under `drive.file`; duplicates recur for hand-made trees |
| Store `driveFolderId` per course, upload straight into it | No listing, no matching, no duplicates; fastest path | New field + backfill for existing courses; folder moves/renames in Drive UI must be re-bound in the app |
| Async uploads (job queue + polling) | Real end-to-end progress; survives slow leg 2 | New infrastructure (queue, job state, UI polling) for a problem the two-phase indicator already makes honest |

---

## Case B — Manual adds in the Drive UI

How it works today: it does not. A hand-made folder/file inside the root is
invisible to every API listing under `drive.file`, so neither upload matching
nor sync can ever find it. Symptoms seen in this session (all one cause):
manual folders never matched, manual files never even appeared as skipped,
deleting the app-created tree dropped sync to `visited: 0`.

Bottlenecks:

1. **Scope blindness (the whole story).** Not naming, not depth, not timing —
   `files.list` simply omits ungranted items. Any fix that keeps `drive.file`
   and keeps "auto-discover manual files" is impossible by API design.
2. **Uploads into manual folders fail the same way.** The parent is invisible,
   so the resolver concludes "nothing matches" and creates a duplicate
   canonical tree next to yours.
3. **Workarounds that look like fixes are not.** Waiting (eventual consistency),
   renaming to match canonically, or moving files between same-named folders
   cannot grant visibility. Only a grant (app creation, picker selection, or a
   broader scope) changes what the API returns.

Options and drawbacks:

| Option | Gain | Drawback |
|---|---|---|
| B1. Add `drive.metadata.readonly` alongside `drive.file` | Manual folders/files become listable with zero UI work; sync "just works" | Consent screen truthfully says the app can see metadata (names/structure, never content) **Drive-wide** — the privacy concern you already rejected |
| B2. Full `drive` scope | Everything works, including writes anywhere | Strictly worse than B1 for privacy; never needed (server never reads content — all calls are `id/name/parents` metadata or creates) |
| B3. Picker-based import (recommended given your constraints) | Keep `drive.file`; admin clicks manual files in Google's picker, each pick grants per-file access; server imports by ID. No blanket visibility, no new account | New build: picker-token endpoint, picker button in moderation, import-by-ID path, `driveFolderId` binding so later uploads hit the picked folder |
| B4. Dedicated library Gmail + B1 | B1's scope sees only library metadata because the account holds nothing else; also fixes ownership/handover | Requires creating a Gmail (phone verification) — rejected |
| B5. Service account (the old design) | Ideal isolation: a separate empty Drive that sees only the shared library folder | Broken uploads on free Gmail (`403: Service Accounts do not have storage quota`); only viable with Workspace Shared Drives, which free accounts lack |
| B6. App-managed only (ban manual Drive edits) | Zero scope change, zero build; Drive UI becomes dumb storage | Kills the workflow you actually use; all organization moves into the dashboard |

---

## Case C — The sync walk (Drive to DB import)

How it works: `POST /sync` walks the root recursively (`walk` in
`server/src/controllers/sync.controllers.ts`), lists children per folder via
`listChildren`, imports unseen PDFs, skips known IDs, auto-creates courses from
`CODE - Title` names, and now reports `visited` + `folders` (capped at 200) plus
`GET /sync/debug` (account email, root ID, root children summary) in
`server/src/routes/sync.route.ts`.

Bottlenecks:

1. **The walker can only process what listings return.** Every "sync missed my
   file" report to date traced to scope blindness or location (file outside the
   root, wrong account in the Drive UI, trashed files excluded, shortcut instead
   of real file, API lag of minutes behind the UI) — never to matching logic.
2. **Scale guards are arbitrary.** `MAX_VISITED_ITEMS` aborts huge trees
   mid-walk (re-run to continue); the folders diagnostic caps at 200 entries.
   Fine for hundreds of files, untested for thousands.
3. **Two-backend confusion.** Uploads and sync disagreeing on identical config
   always means two servers (local dev vs deployed API) or two folders with the
   same look. `sync/debug` vs the browser Network tab resolves it in one check.
4. **No content verification.** Sync catalogs by name/ID/parents only. A corrupt
   or wrong PDF imports as happily as a good one.

Options and drawbacks:

| Option | Gain | Drawback |
|---|---|---|
| Keep walk + diagnostics (current) | Correct for the app-created tree; `visited`/`folders`/`debug` end all guesswork | Cannot discover manual files under `drive.file` — by design, not by bug |
| Raise/remove walk caps, paginate deeper | Handles thousand-file libraries | Longer sync runs, longer admin waits, higher Drive quota burn per run |
| Per-file verify (size/MIME re-check on import) | Catches half-uploads and non-PDFs | More API calls per file; still metadata-only, still blind to ungranted files |

---

## Recommendation

Given your two hard constraints — no whole-Drive metadata visibility, no new
Gmail — the consistent combination is **A-keep + B3 + C-keep**: tolerant path
matching stays as fallback, manual intake moves to picker-based import with a
stored `driveFolderId` per course (which simultaneously fixes upload
duplicates), and the sync walk keeps serving the app-created tree with its new
diagnostics. Nothing in that combination needs a scope change, a new account,
or content access.
