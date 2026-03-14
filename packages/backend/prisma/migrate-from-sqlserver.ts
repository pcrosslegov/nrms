/**
 * Data Migration Script: SQL Server (legacy Gcpe.Hub) → PostgreSQL (NRMS)
 *
 * Prerequisites:
 *   npm install mssql
 *   Set environment variables:
 *     MSSQL_HOST, MSSQL_USER, MSSQL_PASSWORD, MSSQL_DATABASE
 *     DATABASE_URL (target PostgreSQL)
 *
 * Usage:
 *   npx ts-node prisma/migrate-from-sqlserver.ts
 */

import { PrismaClient, ReleaseType } from '@prisma/client';

const prisma = new PrismaClient();

// Language LCID → code mapping
const LANG_MAP: Record<number, string> = {
  4105: 'en',
  3084: 'fr',
};

// ReleaseType int → enum mapping
const RELEASE_TYPE_MAP: Record<number, ReleaseType> = {
  0: ReleaseType.RELEASE,
  1: ReleaseType.STORY,
  2: ReleaseType.FACTSHEET,
  3: ReleaseType.UPDATE,
  4: ReleaseType.ADVISORY,
};

async function main() {
  let sql: any;
  try {
    sql = require('mssql');
  } catch {
    console.error('mssql package not installed. Run: npm install mssql');
    process.exit(1);
  }

  const pool = await sql.connect({
    server: process.env.MSSQL_HOST ?? 'localhost',
    user: process.env.MSSQL_USER ?? 'sa',
    password: process.env.MSSQL_PASSWORD ?? '',
    database: process.env.MSSQL_DATABASE ?? 'Gcpe.Hub',
    options: { trustServerCertificate: true },
  });

  console.log('Connected to SQL Server');

  // ─── Ministries ─────────────────────────────────────────────
  console.log('Migrating ministries...');
  const ministries = await pool.request().query(
    `SELECT Id, [Key], SortOrder, DisplayName, Abbreviation, IsActive FROM [dbo].[Ministry]`,
  );
  for (const row of ministries.recordset) {
    await prisma.ministry.upsert({
      where: { key: row.Key },
      update: {},
      create: {
        id: row.Id,
        key: row.Key,
        displayName: row.DisplayName,
        abbreviation: row.Abbreviation,
        sortOrder: row.SortOrder,
        isActive: row.IsActive,
      },
    });
  }
  console.log(`  ${ministries.recordset.length} ministries`);

  // ─── Sectors ────────────────────────────────────────────────
  console.log('Migrating sectors...');
  const sectors = await pool.request().query(
    `SELECT Id, [Key], SortOrder, DisplayName, IsActive FROM [dbo].[Sector]`,
  );
  for (const row of sectors.recordset) {
    await prisma.sector.upsert({
      where: { key: row.Key },
      update: {},
      create: {
        id: row.Id,
        key: row.Key,
        displayName: row.DisplayName,
        sortOrder: row.SortOrder,
        isActive: row.IsActive,
      },
    });
  }
  console.log(`  ${sectors.recordset.length} sectors`);

  // ─── Themes ─────────────────────────────────────────────────
  console.log('Migrating themes...');
  const themes = await pool.request().query(
    `SELECT Id, [Key], DisplayName, SortOrder, IsActive FROM [dbo].[Theme]`,
  );
  for (const row of themes.recordset) {
    await prisma.theme.upsert({
      where: { key: row.Key },
      update: {},
      create: {
        id: row.Id,
        key: row.Key,
        displayName: row.DisplayName,
        sortOrder: row.SortOrder,
        isActive: row.IsActive,
      },
    });
  }
  console.log(`  ${themes.recordset.length} themes`);

  // ─── Tags ───────────────────────────────────────────────────
  console.log('Migrating tags...');
  const tags = await pool.request().query(
    `SELECT Id, [Key], DisplayName, SortOrder, IsActive FROM [dbo].[Tag]`,
  );
  for (const row of tags.recordset) {
    await prisma.tag.upsert({
      where: { key: row.Key },
      update: {},
      create: {
        id: row.Id,
        key: row.Key,
        displayName: row.DisplayName,
        sortOrder: row.SortOrder,
        isActive: row.IsActive,
      },
    });
  }
  console.log(`  ${tags.recordset.length} tags`);

  // ─── News Releases ──────────────────────────────────────────
  console.log('Migrating news releases...');
  const releases = await pool.request().query(`
    SELECT Id, ReleaseType, [Key], Reference, [Year], YearRelease,
           MinistryId, MinistryRelease, ReleaseDateTime, PublishDateTime,
           IsCommitted, IsPublished, PublishOptions, IsActive,
           HasMediaAssets, NodSubscribers, MediaSubscribers,
           AtomId, Keywords, AssetUrl, RedirectUrl
    FROM [dbo].[NewsRelease]
    WHERE IsActive = 1
  `);

  let releaseCount = 0;
  for (const row of releases.recordset) {
    const publishOptions = row.PublishOptions ?? 0;

    await prisma.newsRelease.upsert({
      where: { id: row.Id },
      update: {},
      create: {
        id: row.Id,
        releaseType: RELEASE_TYPE_MAP[row.ReleaseType] ?? ReleaseType.RELEASE,
        key: row.Key || `legacy-${row.Id}`,
        reference: row.Reference ?? '',
        year: row.Year,
        yearRelease: row.YearRelease,
        ministryId: row.MinistryId,
        ministryRelease: row.MinistryRelease,
        releaseDateTime: row.ReleaseDateTime,
        publishDateTime: row.PublishDateTime,
        isCommitted: row.IsCommitted,
        isPublished: row.IsPublished,
        isActive: row.IsActive,
        publishToWeb: (publishOptions & 1) !== 0,
        publishToNewsOnDemand: (publishOptions & 2) !== 0,
        publishToMediaDistribution: (publishOptions & 4) !== 0,
        hasMediaAssets: row.HasMediaAssets,
        nodSubscribers: row.NodSubscribers,
        mediaSubscribers: row.MediaSubscribers,
        atomId: row.AtomId ?? '',
        keywords: row.Keywords ?? '',
        assetUrl: row.AssetUrl ?? '',
        redirectUrl: row.RedirectUrl ?? '',
      },
    });
    releaseCount++;
  }
  console.log(`  ${releaseCount} releases`);

  // ─── Release Languages ──────────────────────────────────────
  console.log('Migrating release languages...');
  const releaseLangs = await pool.request().query(
    `SELECT ReleaseId, LanguageId, Location, Summary, SocialMediaHeadline, SocialMediaSummary FROM [dbo].[NewsReleaseLanguage]`,
  );
  for (const row of releaseLangs.recordset) {
    const langCode = LANG_MAP[row.LanguageId];
    if (!langCode) continue;
    try {
      await prisma.newsReleaseLanguage.upsert({
        where: { releaseId_languageId: { releaseId: row.ReleaseId, languageId: langCode } },
        update: {},
        create: {
          releaseId: row.ReleaseId,
          languageId: langCode,
          location: row.Location ?? '',
          summary: row.Summary ?? '',
          socialMediaHeadline: row.SocialMediaHeadline,
          socialMediaSummary: row.SocialMediaSummary,
        },
      });
    } catch { /* skip orphans */ }
  }
  console.log(`  ${releaseLangs.recordset.length} release language records`);

  // ─── Documents ──────────────────────────────────────────────
  console.log('Migrating documents...');
  const docs = await pool.request().query(
    `SELECT Id, ReleaseId, SortIndex, PageLayout FROM [dbo].[NewsReleaseDocument]`,
  );
  for (const row of docs.recordset) {
    try {
      await prisma.newsReleaseDocument.upsert({
        where: { id: row.Id },
        update: {},
        create: {
          id: row.Id,
          releaseId: row.ReleaseId,
          sortIndex: row.SortIndex,
          pageLayout: row.PageLayout,
        },
      });
    } catch { /* skip orphans */ }
  }
  console.log(`  ${docs.recordset.length} documents`);

  // ─── Document Languages ─────────────────────────────────────
  console.log('Migrating document languages...');
  const docLangs = await pool.request().query(
    `SELECT DocumentId, LanguageId, PageTitle, Organizations, Headline, Subheadline, Byline, BodyHtml FROM [dbo].[NewsReleaseDocumentLanguage]`,
  );
  for (const row of docLangs.recordset) {
    const langCode = LANG_MAP[row.LanguageId];
    if (!langCode) continue;
    try {
      await prisma.newsReleaseDocumentLanguage.upsert({
        where: { documentId_languageId: { documentId: row.DocumentId, languageId: langCode } },
        update: {},
        create: {
          documentId: row.DocumentId,
          languageId: langCode,
          pageTitle: row.PageTitle ?? '',
          organizations: row.Organizations ?? '',
          headline: row.Headline ?? '',
          subheadline: row.Subheadline ?? '',
          byline: row.Byline ?? '',
          bodyHtml: row.BodyHtml ?? '',
        },
      });
    } catch { /* skip orphans */ }
  }
  console.log(`  ${docLangs.recordset.length} document language records`);

  // ─── Logs ───────────────────────────────────────────────────
  console.log('Migrating audit logs...');
  const logs = await pool.request().query(
    `SELECT ReleaseId, [DateTime], UserId, Description FROM [dbo].[NewsReleaseLog]`,
  );
  for (const row of logs.recordset) {
    try {
      await prisma.newsReleaseLog.create({
        data: {
          releaseId: row.ReleaseId,
          dateTime: row.DateTime,
          userId: row.UserId,
          description: (row.Description ?? '').slice(0, 200),
        },
      });
    } catch { /* skip orphans */ }
  }
  console.log(`  ${logs.recordset.length} log entries`);

  // ─── Update search vectors ──────────────────────────────────
  console.log('Updating search vectors...');
  await prisma.$executeRawUnsafe(`
    UPDATE news_release SET "searchVector" = (
      SELECT
        setweight(to_tsvector('english', coalesce(nrl."summary", '')), 'A') ||
        setweight(to_tsvector('english', coalesce(nrdl."headline", '')), 'A') ||
        setweight(to_tsvector('english', coalesce(nrdl."bodyHtml", '')), 'B') ||
        setweight(to_tsvector('english', coalesce(nr."keywords", '')), 'C')
      FROM news_release nr
      LEFT JOIN news_release_language nrl ON nrl."releaseId" = nr.id AND nrl."languageId" = 'en'
      LEFT JOIN news_release_document nrd ON nrd."releaseId" = nr.id
      LEFT JOIN news_release_document_language nrdl ON nrdl."documentId" = nrd.id AND nrdl."languageId" = 'en'
      WHERE nr.id = news_release.id
      LIMIT 1
    )
  `);
  console.log('  Done');

  // ─── Set sequence to max existing reference ─────────────────
  const maxRef = await prisma.newsRelease.findFirst({
    where: { reference: { startsWith: 'NEWS-' } },
    orderBy: { reference: 'desc' },
    select: { reference: true },
  });
  if (maxRef?.reference) {
    const maxNum = parseInt(maxRef.reference.replace('NEWS-', ''), 10);
    await prisma.$executeRawUnsafe(
      `SELECT setval('news_reference_seq', $1)`,
      maxNum,
    );
    console.log(`Set news_reference_seq to ${maxNum}`);
  }

  await pool.close();
  console.log('\nMigration complete!');
}

main()
  .catch((e) => {
    console.error('Migration failed:', e.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
