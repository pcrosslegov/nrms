# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Development Commands

```bash
# Backend (from packages/backend/)
npm run start:dev          # Start NestJS in watch mode on :3000
npm run build              # nest build → dist/
npm test                   # Jest unit tests (28 tests across 7 suites)
npm run seed               # Seed reference data (ministries, sectors, etc.)
npx prisma migrate deploy  # Apply database migrations
npx prisma generate        # Regenerate Prisma client after schema changes

# Frontend (from packages/frontend/)
npm run dev                # Vite dev server on :5173 (proxies /api → :3000)
npm run build              # tsc -b && vite build → dist/
npx tsc -b --noEmit        # Type-check without emitting

# Run a single backend test file
npx jest src/workflow/workflow.service.spec.ts --forceExit

# Docker
docker compose up -d       # Start PostgreSQL only (no Docker needed if local PG available)
```

## Architecture

**Monorepo** with two packages: `packages/backend` (NestJS + Prisma) and `packages/frontend` (React + Vite + Tailwind). In production, the frontend is built as static files and served by the backend via `ServeStaticModule`.

### Backend Module Graph

`AppModule` imports all feature modules. `PrismaModule` is `@Global` — `PrismaService` is injectable everywhere without importing. Key dependency chains:

- **WorkflowModule** → `GenerationModule` (needs HTML/TXT/PDF generation for publish)
- **ImagesModule** → `StorageModule` (file persistence abstraction)
- **IntegrationsModule** → `GenerationModule` (NOD service needs generated content)
- **AuditModule** provides `APP_INTERCEPTOR` globally — auto-logs mutations on release-scoped routes

### Auth — Dual Mode

The system accepts **both** local JWT tokens and Azure AD Bearer tokens. `JwtAuthGuard` (used on all protected endpoints) dynamically detects whether the `azure-ad` Passport strategy is registered at runtime. When `AZURE_AD_TENANT_ID` is not set, Azure AD strategy is skipped entirely and only local JWT works.

Azure AD users are auto-provisioned in the `User` table on first login (empty `passwordHash`). The frontend fetches `GET /api/auth/config` on mount to decide whether to show the Microsoft login button.

### Database Patterns

- **Prisma schema** maps to PostgreSQL with `@@map("snake_case")` table names
- **Soft deletes**: `isActive` boolean on `NewsRelease` — use `where: { isActive: true }` in queries
- **Bilingual content**: Language IDs are `"en"` / `"fr"` strings (not Windows LCIDs)
- **NEWS-##### references**: Generated via PostgreSQL sequence `news_reference_seq` (atomic, gap-free)
- **Full-text search**: `searchVector` column (tsvector) on `news_release` with GIN index. Updated via raw SQL in `SearchService`
- **Release key format**: `YYYY[MINISTRY_ABBR]MMMM-YYYYYY` (e.g. `2026PREM0001-000001`)

### Workflow State Machine

Releases follow: **Draft** → `approve` → **Approved** (gets NEWS-##### + key) → `schedule`/`publish` → **Scheduled/Published** → `unpublish` → back to Draft. A background cron (`PublishCronService`, every 60s) auto-publishes committed releases past their scheduled time.

### Frontend Data Flow

API calls use a thin fetch wrapper (`src/api/client.ts`) that attaches the Bearer token from `localStorage`. All data fetching uses TanStack Query hooks (`src/api/releases.ts`, `src/api/workflow.ts`, etc.) with query key invalidation on mutations. The Vite dev server proxies `/api` to the backend.

### HTML Sanitization

Document body HTML is sanitized server-side via `sanitize-html` in `DocumentsService.updateLanguage()` before persisting. The allowlist is configured in that file.

### Integration Stubs

`FlickrService`, `NodService`, and `EmailService` in `src/integrations/` are stubs — they log intended actions but make no external API calls. They are safe to call; they check their own configuration (e.g. `SMTP_HOST`) and no-op when unconfigured.

## Important Conventions

- Do not add `Co-Authored-By` trailers to git commit messages
- `packages/backend/.env` is gitignored — use `.env.example` as reference
- Preview/PDF endpoints (`workflow/preview/html`, `workflow/pdf`) are intentionally unauthenticated for browser-tab access
- The `FilesController` (image serving) is also unauthenticated
- All other mutation endpoints require `@UseGuards(JwtAuthGuard)`
- New releases get a temporary `key` (`draft-{timestamp}-{random}`) — the real key is assigned on approve
