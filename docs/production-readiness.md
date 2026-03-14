# NRMS Production Readiness — Gaps & External Dependencies

This document describes what remains to make NRMS a full end-to-end production system. Each section identifies the gap, what currently exists, and what needs to happen.

---

## 1. Authentication & Authorization

### Keycloak SSO Integration

**Current state**: Local JWT auth with email/password registration and login. Works for development but not suitable for production.

**What's needed**:
- Provision a Keycloak server (or connect to an existing instance)
- Configure a realm and OIDC client for NRMS
- Replace `JwtStrategy` in `src/auth/jwt.strategy.ts` with a Keycloak/OIDC strategy (the module is designed for this swap)
- Map Keycloak groups/roles to application permissions
- Environment variables are already stubbed in `.env.example` (`KEYCLOAK_URL`, `KEYCLOAK_REALM`, `KEYCLOAK_CLIENT_ID`)

### Role-Based Access Control

**Current state**: Any authenticated user can perform any action — create, approve, publish, manage reference data.

**What's needed**:
- Define roles: Editor, Approver, Publisher, Admin
- Add a role guard that checks the user's role before allowing workflow actions (e.g. only Approvers can approve, only Publishers can publish)
- Ministry-scoped permissions (users should only edit releases for their assigned ministry)
- Role assignment UI or Keycloak group mapping

---

## 2. File Storage

### S3/MinIO Object Storage Backend

**Current state**: `StorageService` in `src/storage/storage.service.ts` writes to the local filesystem (`STORAGE_PATH` env var). Works for development.

**What's needed**:
- Implement an S3-compatible storage backend using `@aws-sdk/client-s3` (or MinIO client)
- Add a factory/config switch to select local vs S3 based on environment
- Provision an S3 bucket or MinIO instance in the OpenShift cluster
- Add `S3_BUCKET`, `S3_ENDPOINT`, `S3_ACCESS_KEY`, `S3_SECRET_KEY` environment variables
- The `StorageService` interface (`save`, `read`, `delete`, `exists`, `getPublicUrl`) is already abstracted for this swap

---

## 3. External Integrations

All integration services exist as stubs with the correct interfaces. They log their intended actions but do not make external API calls.

### Flickr OAuth & Photo Permissions

**File**: `src/integrations/flickr.service.ts`

**Current state**: Stub that logs "Would set photo public/private". No actual Flickr API calls.

**What's needed**:
- Flickr API key and secret (set via `FLICKR_API_KEY`, `FLICKR_API_SECRET`)
- Implement OAuth 1.0a token management (the legacy system used `FlickrManager.cs` for this)
- Implement `flickr.photos.setPerms` API calls to toggle photo visibility on publish/unpublish
- Store OAuth tokens securely (likely in the database or a secret manager)
- Wire into the publish/unpublish workflow to automatically toggle associated Flickr photos

### NewsOnDemand Subscription Publishing

**File**: `src/integrations/nod.service.ts`

**Current state**: Stub that logs distribution intent. Does not connect to any subscriber database.

**What's needed**:
- Determine what subscriber database/API the legacy `NodSubscriptions.cs` connected to
- Implement subscriber lookup and email distribution
- Query subscriber counts and update `nodSubscribers` on the release record
- Wire into the publish cron job (currently only marks releases as published, doesn't distribute)
- Respect the `publishToNewsOnDemand` flag on each release

### SMTP Email Relay

**File**: `src/integrations/email.service.ts`

**Current state**: Nodemailer is configured but disabled when no `SMTP_HOST` is set. No emails are sent in development.

**What's needed**:
- A real SMTP relay server (e.g. government mail relay, Amazon SES, or similar)
- Set environment variables: `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`
- The `EmailService.send()` method is fully functional — it just needs a configured transport
- Used by NOD distribution and any future notification features

### PDF Generation in Containers

**File**: `src/generation/generation.service.ts` (Puppeteer)

**Current state**: Works locally using the system Chrome/Chromium. The Dockerfile installs Chromium in the Alpine image.

**What's needed**:
- Test PDF generation inside the OpenShift container — Chromium in containers can have sandbox and memory issues
- The Dockerfile sets `PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser` and uses `--no-sandbox` args
- May need increased memory limits in the OpenShift deployment (currently 512Mi limit)
- Consider a fallback: if Puppeteer fails in the container, an alternative like `html-pdf-node` or a dedicated PDF microservice could be used

---

## 4. Infrastructure

### OpenShift Deployment

**Current state**: Deployment manifests exist in `openshift/` (Deployment, Service, Route, PVC, PostgreSQL, Secrets). They have not been applied to a real cluster.

**What's needed**:
- Build and push the Docker image to the OpenShift internal registry (or an external registry)
- Create secrets with real values (`oc create -f openshift/secrets.yaml` after editing)
- Provision PVCs (uploads and PostgreSQL data)
- Apply manifests: `oc apply -f openshift/`
- Configure DNS for the Route
- Run `npx prisma migrate deploy` inside the running pod to apply the schema
- Run `npm run seed` to populate reference data

### PostgreSQL in Production

**Current state**: Development uses a local PostgreSQL 14 instance. The OpenShift manifests include a basic single-replica PostgreSQL deployment.

**What's needed**:
- For production: a managed PostgreSQL service or a properly configured StatefulSet with:
  - Automated backups (pg_dump cron or WAL archiving)
  - Replication for high availability
  - Connection pooling (PgBouncer)
  - Monitoring and alerting
- The single-replica deployment in `openshift/postgresql.yaml` is suitable for staging but not production

### TLS Certificates

**Current state**: The OpenShift Route has `tls.termination: edge` configured but no certificate specified.

**What's needed**:
- Real TLS certificates for the production domain
- Either: cert-manager with Let's Encrypt auto-renewal, or manually provisioned certificates added to the Route spec
- `insecureEdgeTerminationPolicy: Redirect` is already set to force HTTPS

---

## 5. Data Migration

### SQL Server to PostgreSQL Migration

**File**: `prisma/migrate-from-sqlserver.ts`

**Current state**: Migration script is written and handles:
- Ministries, Sectors, Themes, Tags (reference data)
- News Releases with type mapping and PublishOptions bitmask → boolean conversion
- Release language content (EN/FR)
- Documents and document language content
- Audit logs
- Search vector rebuild
- Sequence sync (sets `news_reference_seq` to max existing NEWS-##### number)

**What's needed**:
- Network access to the legacy SQL Server instance from the migration environment
- Install the `mssql` npm package: `npm install mssql`
- Set environment variables: `MSSQL_HOST`, `MSSQL_USER`, `MSSQL_PASSWORD`, `MSSQL_DATABASE`
- Run: `npx ts-node prisma/migrate-from-sqlserver.ts`
- Verify data integrity after migration (spot-check release counts, reference numbers, content)

### Blob/Image Migration

**Not yet implemented.**

The legacy system stores images as `varbinary(max)` in the `dbo.Blob` table, referenced by `NewsReleaseImage.BlobId`. The current migration script does not extract these.

**What's needed**:
- A separate migration step that:
  1. Queries each `NewsReleaseImage` joined to `Blob` to get the binary data
  2. Pipes each image through `sharp` for scaling (original, large, medium, thumbnail)
  3. Writes the scaled versions to S3/filesystem via `StorageService`
  4. Creates `NewsReleaseImage` records in PostgreSQL with the new file paths
  5. Migrates `NewsReleaseImageLanguage` alt text records with LCID → `en`/`fr` mapping

### Historical Publish Snapshots

**Not yet implemented.**

The legacy `NewsReleaseHistory` table stores rendered HTML/TXT snapshots as blobs (one per publish event). These are referenced by `ReleaseId + PublishDateTime + MimeType`.

**What's needed** (optional):
- Extract each history blob and write to file storage
- Create `NewsReleaseHistory` records in PostgreSQL with file paths
- This preserves the historical publish record but is not required for the system to function

---

## 6. Missing Business Logic

### Media Distribution Subscriber Counts

On publish, the legacy system queries contact databases to count how many NOD subscribers and media contacts would receive the release. These counts are stored on the release record (`nodSubscribers`, `mediaSubscribers`).

**Current state**: The fields exist in the schema but are never populated.

**What's needed**: Integration with the subscriber/contact database to query counts at publish time.

### Carousel / Homepage Slides

The legacy database has `dbo.Carousel` and `dbo.Slide` tables for a homepage carousel feature.

**Current state**: Not ported. Unclear if this feature is still in active use.

**Decision needed**: Is this feature required? If so, it's a straightforward CRUD module.

### Calendar / Activity System

The legacy database has an entire `calendar` schema with ~25 tables (Activity, ActivityCategories, EventPlanner, GovernmentRepresentative, etc.).

**Current state**: Not ported. This appears to be a separate application concern from news release management.

**Decision needed**: Is this in scope for NRMS, or is it a separate system?

### Media Request Tracking

The legacy database has a `media` schema with ~30 tables (Company, Contact, MediaRequest, Beat, Distribution, etc.) — a full media contacts and request tracking system.

**Current state**: Not ported. This is clearly a separate application.

**Decision needed**: Confirm this remains a separate system.

---

## 7. Testing

### Integration / E2E Tests

**Current state**: 28 unit tests with mocked Prisma service. All pass.

**What's needed**:
- Integration tests that run against a real PostgreSQL database (use a test database or Docker container)
- Test the full request cycle: HTTP request → controller → service → database → response
- Test workflow sequences: create → edit → approve → schedule → publish → unpublish
- Test edge cases: duplicate approval, publish without approval, concurrent publishes

### Browser / UI Tests

**Current state**: No browser tests.

**What's needed**:
- Playwright or Cypress tests covering:
  - Login flow
  - Create and edit a release
  - Rich text editor functionality
  - Workflow button state transitions
  - Search functionality
  - Image upload

### Load Testing

**Current state**: Untested under concurrent users.

**What's needed**:
- Load test with expected concurrent user count (likely low — communications staff only)
- Verify the background publish cron doesn't conflict with manual publishes
- Test PostgreSQL connection pooling under load

---

## 8. Shortest Path to Production

The minimum required to go live, in priority order:

1. **Keycloak SSO** — or keep local auth temporarily with role guards added for approve/publish
2. **Real SMTP relay** — configure `SMTP_HOST` so email distribution works
3. **S3 storage backend** — implement the S3 client in `StorageService` for OpenShift
4. **Run data migration** — connect to legacy SQL Server and migrate releases + reference data
5. **Deploy to OpenShift** — push image, create secrets, apply manifests, run migrations
6. **Blob/image migration** — extract legacy images from SQL Server `Blob` table to S3

The Flickr integration, NOD subscriber database, and media contact counts can follow as a fast-follow since the legacy system can run in parallel during the transition period.
