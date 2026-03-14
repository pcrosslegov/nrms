# NRMS — News Release Management System

A modern replacement for the legacy .NET/SQL Server news release management platform, built with NestJS, React, and PostgreSQL.

## Stack

| Layer | Technology |
|-------|-----------|
| Backend | NestJS + Prisma ORM |
| Frontend | React + TypeScript + Vite + Tailwind CSS |
| Database | PostgreSQL 16 |
| Auth | Azure AD SSO + local JWT (dual mode) |
| Editor | TipTap rich text editor |
| Storage | Local filesystem (dev), S3/MinIO (prod) |
| Jobs | @nestjs/schedule (background publish cron) |
| Container | Docker + docker-compose + OpenShift manifests |

## Monorepo Structure

```
nrms/
├── docker-compose.yml                # PostgreSQL for local dev
├── Dockerfile                        # Multi-stage build for OpenShift
├── openshift/                        # Deployment, Service, Route, PVC, Secrets
├── docs/
│   └── production-readiness.md       # Gaps & external dependencies
└── packages/
    ├── backend/                      # NestJS API
    │   ├── prisma/
    │   │   ├── schema.prisma         # 24 models (ported from SQL Server)
    │   │   ├── migrations/           # PostgreSQL migrations
    │   │   ├── seed.ts               # Reference data seeder
    │   │   └── migrate-from-sqlserver.ts  # Legacy data migration script
    │   └── src/
    │       ├── auth/                 # Azure AD + local JWT dual auth
    │       ├── releases/             # CRUD + paginated filtering + full-text search
    │       ├── documents/            # Multi-doc, multi-language content + sanitization
    │       ├── workflow/             # Approve, Schedule, Publish, Unpublish + cron
    │       ├── generation/           # HTML/TXT/PDF output
    │       ├── images/               # Upload + sharp scaling + alt text per language
    │       ├── reference-data/       # Ministries, Sectors, Themes, Tags
    │       ├── integrations/         # Flickr, NewsOnDemand, iCal feed, email
    │       ├── storage/              # Abstraction: local FS / S3
    │       ├── audit/                # Logging interceptor
    │       ├── health/               # Liveness, readiness, health check endpoints
    │       └── prisma/               # Prisma service
    └── frontend/                     # React SPA
        └── src/
            ├── pages/                # Dashboard, Releases, Release Editor, Search, Login
            ├── components/           # Layout, RichTextEditor, WorkflowActions, ImageUpload, MultiSelect, AuditLog
            └── api/                  # Auth context (Azure AD + local), API client, TanStack Query hooks
```

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL 14+ (or Docker)

### Quick Start (local PostgreSQL)

```bash
createdb nrms
cd packages/backend
cp ../.env.example .env               # Edit DATABASE_URL for your local setup
npm install
npx prisma migrate deploy             # Apply schema
npm run seed                           # Seed reference data (20 ministries, etc.)
npm run start:dev                      # API on :3000
```

In a second terminal:

```bash
cd packages/frontend
npm install
npm run dev                            # Vite dev server on :5173
```

### Quick Start (Docker)

```bash
docker compose up -d                   # Start PostgreSQL
cd packages/backend
cp ../.env.example .env
npm install
npx prisma migrate deploy
npm run seed
npm run start:dev
```

### Default Login

| Email | Password |
|-------|----------|
| `admin@nrms.local` | `admin123!` |

### Azure AD Login (optional)

To enable "Sign in with Microsoft" alongside local auth, add to `.env`:

```
AZURE_AD_TENANT_ID=your-tenant-guid
AZURE_AD_CLIENT_ID=your-app-client-id
AZURE_AD_REDIRECT_URI=http://localhost:5173
```

Register an App Registration in your Azure AD tenant with a SPA redirect URI. When configured, the login page shows both a "Sign in with Microsoft" button and the local email/password form. Users who sign in via Azure AD are auto-provisioned in the database on first login. When not configured, only local auth is shown.

## API Endpoints

### Auth
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/register` | Create local account |
| POST | `/api/auth/login` | Get local JWT token |
| GET | `/api/auth/profile` | Current user (auth required) |
| GET | `/api/auth/config` | Auth configuration (Azure AD enabled?) |

### Releases (auth required)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/releases?tab=drafts&page=1` | List releases by tab |
| GET | `/api/releases/:id` | Release detail with all associations |
| POST | `/api/releases` | Create new release |
| PATCH | `/api/releases/:id` | Update release metadata |
| PUT | `/api/releases/:id/language/:langId` | Update release language content |
| PUT | `/api/releases/:id/associations` | Set ministries/sectors/themes/tags |
| DELETE | `/api/releases/:id` | Soft-delete release |

### Documents (auth required)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/releases/:id/documents` | List documents for a release |
| POST | `/api/releases/:id/documents` | Add a document |
| PUT | `/api/releases/:id/documents/:docId/languages/:langId` | Update document content (HTML sanitized) |
| PUT | `/api/releases/:id/documents/:docId/languages/:langId/contacts` | Set contact info |
| DELETE | `/api/releases/:id/documents/:docId` | Remove a document |

### Workflow (auth required for mutations)
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/releases/:id/workflow/approve` | Approve — assigns NEWS-##### reference + key slug |
| POST | `/api/releases/:id/workflow/schedule` | Schedule for future publish |
| POST | `/api/releases/:id/workflow/publish` | Publish immediately |
| POST | `/api/releases/:id/workflow/unpublish` | Unpublish / cancel schedule |
| GET | `/api/releases/:id/workflow/preview` | Preview (JSON with HTML + TXT) |
| GET | `/api/releases/:id/workflow/preview/html` | Preview as rendered HTML page |
| GET | `/api/releases/:id/workflow/pdf` | Download as PDF |

### Images (auth required)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/releases/:id/images` | List images |
| POST | `/api/releases/:id/images` | Upload image (auto-scaled to 4 sizes) |
| PUT | `/api/releases/:id/images/:imgId/alt/:langId` | Set alt text per language |
| DELETE | `/api/releases/:id/images/:imgId` | Delete image |

### Search (auth required)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/search?q=keyword&page=1` | Full-text search with ranked results |

### Reference Data
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/ministries` | List active ministries |
| GET | `/api/sectors` | List active sectors |
| GET | `/api/themes` | List active themes |
| GET | `/api/tags` | List active tags |

All reference data endpoints support `?all=true` to include inactive records. POST/PATCH require authentication.

### Other
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/feed/ical` | iCalendar feed of scheduled releases |
| GET | `/api/health` | Health check |
| GET | `/api/health/ready` | Readiness (database connectivity) |
| GET | `/api/health/live` | Liveness probe |

## Key Features

- **Dual authentication** — Azure AD SSO and local accounts work simultaneously; both always available, even in production
- **Bilingual content** — EN required, FR optional, per-document language tabs
- **Rich text editing** — TipTap editor with formatting toolbar (bold, italic, headings, lists, links, quotes)
- **HTML sanitization** — `sanitize-html` strips XSS on every document save
- **Workflow engine** — Draft → Approve (NEWS-##### + key slug) → Schedule/Publish → Unpublish, with validation guards at each step
- **Background publish cron** — every 60 seconds, auto-publishes committed releases past their scheduled time
- **Document generation** — styled HTML, plain text, and PDF (via Puppeteer) output
- **Image management** — upload with automatic sharp scaling (original, large, medium, thumbnail), alt text per language
- **Full-text search** — PostgreSQL `tsvector`/`tsquery` with weighted ranking (headline/summary A, body B, keywords C)
- **Audit trail** — automatic logging of all release mutations via NestJS interceptor
- **iCalendar feed** — `/api/feed/ical` for subscribing to scheduled releases in calendar apps
- **OpenShift-ready** — multi-stage Dockerfile, non-root user (UID 1001), health probes, deployment manifests

## Schema Migration from Legacy

Key type mappings from SQL Server → PostgreSQL:

| SQL Server | PostgreSQL |
|-----------|-----------|
| `uniqueidentifier` | `UUID` |
| `bit` | `BOOLEAN` |
| `datetimeoffset` | `TIMESTAMPTZ` |
| `nvarchar(max)` | `TEXT` |
| `varbinary(max)` (Blob table) | File path + object storage |

Other changes:
- Language IDs simplified from Windows LCID (4105/3084) to `en`/`fr` string codes
- `PublishOptions` bitmask replaced with explicit boolean columns (`publishToWeb`, `publishToNewsOnDemand`, `publishToMediaDistribution`)
- PostgreSQL sequence (`news_reference_seq`) for atomic NEWS-##### reference generation
- Full-text search via `tsvector`/`tsquery` GIN index

A data migration script is provided at `prisma/migrate-from-sqlserver.ts`. See [docs/production-readiness.md](docs/production-readiness.md) for details.

## Tests

```bash
cd packages/backend
npm test                               # 28 unit tests
```

## Configuration

All configuration is via environment variables. See [.env.example](.env.example) for the full list:

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `JWT_SECRET` | Yes | Secret for signing local JWT tokens |
| `JWT_EXPIRY` | No | Token expiry (default: `24h`) |
| `AZURE_AD_TENANT_ID` | No | Azure AD tenant — enables Microsoft SSO |
| `AZURE_AD_CLIENT_ID` | No | Azure AD app registration client ID |
| `AZURE_AD_REDIRECT_URI` | No | OAuth redirect URI (default: origin) |
| `STORAGE_PATH` | No | File storage path (default: `./uploads`) |
| `SMTP_HOST` | No | SMTP relay — enables email sending |
| `FLICKR_API_KEY` | No | Flickr integration |

## Documentation

- [Production Readiness — Gaps & External Dependencies](docs/production-readiness.md)

## Architecture Decisions

| Decision | Rationale |
|----------|-----------|
| Azure AD + local JWT dual auth | Government SSO requirement, but local accounts needed for service accounts and environments without Azure AD |
| PostgreSQL over SQL Server | Open source, runs on OpenShift, native full-text search, better JSON support |
| Prisma ORM | Type-safe database access, automatic migration management, schema-as-code |
| TipTap over CKEditor/Quill | Modern ProseMirror-based, tree-shakeable, excellent React integration |
| `sanitize-html` over legacy `HtmlTagCleaner.cs` | Maintained OSS library, configurable allowlists, XSS prevention |
| `sharp` over GDI+ | Cross-platform, no native Windows dependencies, fast WebAssembly-based |
| Puppeteer for PDF | Renders the same HTML template as preview, pixel-perfect output |
| PostgreSQL sequence for NEWS-##### | Atomic, gap-free serial generation without application-level locking |
