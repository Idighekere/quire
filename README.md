# Quire — A quire for every course

A community-built library for UNIUYO engineering students: past questions, lecture notes, and textbooks organized by course instead of scattered across Drive folders and WhatsApp chats. Live at **https://usequire.vercel.app**.

Students browse, preview, download, and share materials with no sign-in. Contributors add materials three ways; admins moderate and bulk-sync from Google Drive.

---

## Features

### Catalogue & materials
- **Course filtering** by department, level, and semester with readable slug URLs (`?department=computer-engineering`) — shareable and WhatsApp-friendly.
- **Course materials pages** with server-side pagination (12/page), category tabs, title search, and newest-first ordering.
- **In-browser preview** (Drive embed with a dedicated header/close button) plus one-tap download and human-readable file sizes.
- **WhatsApp-first sharing**: per-card share buttons (WhatsApp deep link, native share, copy link) and per-page preview cards rendered by a crawler-only serverless function (`/api/og`).

### Contribution (no Drive expertise needed)
- **Upload from device** (15 MB cap): stored in the library's Drive under `Level / Semester / CODE - Title`, auto-shared, pending review.
- **Paste Drive link**: rejected unless shared as Anyone with the link; size captured from the verification request.
- **Pick from my Google Drive**: per-file picker grants on the contributor's own Drive, course taken from the form, files they own auto-shared.
- **Material requests** with upvotes and fulfill-by-linking (fulfilled links deep-link with the title pre-filled in search).

### Admin & sync
- **Moderation queue** (approve/reject), dashboard sorting (recently added, A–Z, most materials), full CRUD.
- **Drive sync that respects privacy**: a `drive.readonly` service account bulk-imports the shared library folder (hand-dropped files included); uploads and pickers stay on per-user OAuth (`drive.file`). The app never sees anyone's whole Drive.
- **Google Picker import** for files the narrow scope cannot list, with publicity verification and duplicate detection.

---

## Tech Stack

### Frontend (`client/`)
- **React + Vite + Tailwind CSS**, shadcn-style UI, Phosphor icons (no lucide)
- **TanStack Query** (server cache, URL-persisted filters), React Router, react-hot-toast

### Backend (`server/`)
- **Node.js + Express + TypeScript** (`bun run build` → `tsc`), **MongoDB/Mongoose**
- **googleapis**: service-account JWT for sync reads, admin OAuth for uploads, anonymous Range-probe for link verification
- Cookie-session JWT auth (access + refresh), role-based routes (admin/uploader)

### Deployment
- **Frontend**: Vercel (`usequire` branch) — static SPA + `/api/og` serverless function, SPA fallback rewrites, crawler-only OG rewrite
- **Backend**: Vercel serverless (`server/` as the function entry)
- **Database**: MongoDB Atlas

---

## API Endpoints (base `/api/v1`)

### Courses
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/courses?department=&level=&semester=` | Filter courses (department accepts shortName, slug, or name) |
| `GET` | `/courses/me?search=&department=&level=&semester=&sort=&page=&limit=` | Dashboard courses (sort: newest, oldest, title-az/za, level, most-books) |
| `POST` | `/courses` | Create a course (admin/uploader) |
| `PATCH` | `/courses/:id` | Update a course |
| `DELETE` | `/courses/:id` | Delete a course (blocked when books exist) |

### Books
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/books/course/:courseCode?page=&limit=&category=&search=` | Paged public materials for a course |
| `GET` | `/books/all?page=&limit=&search=&category=` | Materials archive |
| `GET` | `/books/?search=&courseCode=&department=&level=&semester=&category=&sort=&page=&limit=` | Dashboard books (sort: newest, oldest, title-az/za) |
| `POST` | `/books` | Add via Drive link (publicity-verified) |
| `POST` | `/upload` | Device upload → library Drive (multipart, 15 MB cap) |
| `PATCH` | `/books/:bookId/status` | Approve/reject (admin) |

### Drive sync & picker
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/sync` | Service-account bulk sync (admin) |
| `GET` | `/sync/debug` | Sync account + root folder diagnostics (admin) |
| `GET` | `/sync/picker-token` | Admin picker token (admin) |
| `POST` | `/sync/import` | Import picker-selected IDs (admin) |
| `GET` | `/sync/my-picker-token` | Contributor picker token (any user) |
| `POST` | `/sync/my-import` | Import from contributor's own Drive (any user) |

### Requests & auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET/POST` | `/requests` | List (open first) / create (public, name/level optional) |
| `POST` | `/requests/:id/upvote`, `POST` | `/requests/:id/fulfill` |
| `POST` | `/auth/register`, `/auth/login`, `/auth/logout` | Password auth |
| `GET` | `/auth/google?drive=1` | Google sign-in / Drive connect (offline consent for refresh token) |
| `GET` | `/auth/google/status` | Admin Drive-connection status |

---

## Setup Instructions

### 1. Clone
```sh
git clone https://github.com/idighekere/faculty-library.git
cd faculty-library
git checkout usequire
```

### 2. Install (bun only)
```sh
cd server && bun install
cd ../client && bun install
```

### 3. Environment variables

Server (`.env`):
```env
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
MONGO_URI=
ACCESS_SECRET=
REFRESH_SECRET=
ACCESS_EXPIRES_IN=
REFRESH_EXPIRES_IN=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=
GOOGLE_DRIVE_ROOT_FOLDER_ID=
GOOGLE_SERVICE_ACCOUNT_EMAIL=
GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY=
```

Client (`.env`):
```env
VITE_BASE_URL=/api/v1
VITE_NODE_ENV=development
VITE_GOOGLE_PICKER_API_KEY=
VITE_GOOGLE_PROJECT_NUMBER=
```

Google Cloud setup: enable Drive API + Google Picker API, create an OAuth client (`drive.file` scope only) and an API key restricted to Websites (your origins **plus `https://docs.google.com/*`**) and the Picker API. Share the library master folder with the service-account email (Viewer is enough; Editor also works).

### 4. Run
```sh
cd server && bun run dev     # nodemon
cd client && bun run dev     # Vite (+ /api proxy to :5000)
```

Builds: `bun run build` in either folder. Never install new packages without approval.

---

## Future Improvements
- Paste-a-folder-link import (admin SA walk + contributor rooted picker)
- Per-book deep links with individual preview cards
- Generated OG images per course

---

## Contributors
- **Idighekere Udo** – Developer
