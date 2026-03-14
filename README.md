# NRMS — News Release Management System

A modern replacement for the legacy .NET/SQL Server news release management platform, built with NestJS, React, and PostgreSQL.

## Stack

| Layer | Technology |
|-------|-----------|
| Backend | NestJS + Prisma ORM |
| Frontend | React + TypeScript + Vite + Tailwind CSS |
| Database | PostgreSQL 16 |
| Auth | JWT (local auth, designed for Keycloak swap) |
| Storage | Local filesystem (dev), S3/MinIO (prod) |
| Container | Docker + docker-compose |

## Monorepo Structure

```
nrms/
├── docker-compose.yml                # PostgreSQL for local dev
├── Dockerfile                        # Multi-stage build for OpenShift
└── packages/
    ├── backend/                      # NestJS API
    │   ├── prisma/
    │   │   ├── schema.prisma         # 24 models (ported from SQL Server)
    │   │   ├── migrations/           # PostgreSQL migrations
    │   │   └── seed.ts               # Reference data seeder
    │   └── src/
    │       ├── auth/                 # JWT register/login/guard
    │       ├── releases/             # CRUD + paginated filtering
    │       ├── reference-data/       # Ministries, Sectors, Themes, Tags
    │       └── prisma/               # Prisma service
    └── frontend/                     # React SPA
        └── src/
            ├── pages/                # Dashboard, Releases, Login
            ├── components/           # Layout shell
            └── api/                  # Auth context, API client, TanStack Query hooks
```

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL 14+ (or Docker)

### With Docker

```bash
docker compose up -d                          # Start PostgreSQL
cd packages/backend
cp .env.example .env                          # Configure DATABASE_URL
npx prisma migrate deploy                     # Apply schema
npm run seed                                  # Seed reference data
npm run start:dev                             # API on :3000
```

In a second terminal:

```bash
cd packages/frontend
npm run dev                                   # Vite dev server on :5173
```

### With Local PostgreSQL

```bash
createdb nrms
cd packages/backend
# Set DATABASE_URL in .env to your local connection string
npx prisma migrate deploy
npm run seed
npm run start:dev
```

### Default Login

| Email | Password |
|-------|----------|
| `admin@nrms.local` | `admin123!` |

## API Endpoints

### Auth
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/register` | Create account |
| POST | `/api/auth/login` | Get JWT token |
| GET | `/api/auth/profile` | Current user (auth required) |

### Releases (auth required)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/releases?tab=drafts&page=1` | List releases by tab |
| GET | `/api/releases/:id` | Release detail with documents |
| POST | `/api/releases` | Create new release |
| PATCH | `/api/releases/:id` | Update release |
| DELETE | `/api/releases/:id` | Soft-delete release |

### Reference Data
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/ministries` | List active ministries |
| GET | `/api/sectors` | List active sectors |
| GET | `/api/themes` | List active themes |
| GET | `/api/tags` | List active tags |

All reference data endpoints support `?all=true` to include inactive records. POST/PATCH require authentication.

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
- `PublishOptions` bitmask replaced with explicit boolean columns
- PostgreSQL sequence (`news_reference_seq`) for atomic NEWS-##### reference generation
- Full-text search via `tsvector`/`tsquery` index

## Tests

```bash
cd packages/backend
npm test
```

## Roadmap

- **Phase 2** — Rich text editing (TipTap), multi-document/language content, audit logging
- **Phase 3** — Workflow (Approve/Schedule/Publish/Unpublish), HTML/PDF generation, background cron
- **Phase 4** — Image uploads (sharp), full-text search, Flickr/NewsOnDemand/iCal integrations
- **Phase 5** — OpenShift containerization, health checks, data migration from SQL Server
