-- CreateEnum
CREATE TYPE "release_type" AS ENUM ('RELEASE', 'STORY', 'FACTSHEET', 'UPDATE', 'ADVISORY');

-- Sequence for NEWS-##### reference numbers
CREATE SEQUENCE news_reference_seq START 1;

-- CreateTable
CREATE TABLE "language" (
    "id" VARCHAR(5) NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "language_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ministry" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "key" VARCHAR(100) NOT NULL,
    "displayName" VARCHAR(255) NOT NULL,
    "abbreviation" VARCHAR(10) NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "ministry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ministry_language" (
    "ministryId" UUID NOT NULL,
    "languageId" VARCHAR(5) NOT NULL,
    "name" VARCHAR(100) NOT NULL,

    CONSTRAINT "ministry_language_pkey" PRIMARY KEY ("ministryId","languageId")
);

-- CreateTable
CREATE TABLE "sector" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "key" VARCHAR(100) NOT NULL,
    "displayName" VARCHAR(255),
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "sector_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sector_language" (
    "sectorId" UUID NOT NULL,
    "languageId" VARCHAR(5) NOT NULL,
    "name" VARCHAR(50) NOT NULL,

    CONSTRAINT "sector_language_pkey" PRIMARY KEY ("sectorId","languageId")
);

-- CreateTable
CREATE TABLE "ministry_sector" (
    "ministryId" UUID NOT NULL,
    "sectorId" UUID NOT NULL,

    CONSTRAINT "ministry_sector_pkey" PRIMARY KEY ("ministryId","sectorId")
);

-- CreateTable
CREATE TABLE "theme" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "key" VARCHAR(255) NOT NULL,
    "displayName" VARCHAR(255),
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "theme_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tag" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "key" VARCHAR(255) NOT NULL,
    "displayName" VARCHAR(255),
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "tag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "key" VARCHAR(255) NOT NULL,
    "displayName" VARCHAR(255),
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "service_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "media_distribution_list" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "key" VARCHAR(50) NOT NULL,
    "displayName" VARCHAR(50) NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "media_distribution_list_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "news_release" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "releaseType" "release_type" NOT NULL DEFAULT 'RELEASE',
    "key" VARCHAR(255) NOT NULL DEFAULT '',
    "reference" VARCHAR(50) NOT NULL DEFAULT '',
    "year" INTEGER,
    "yearRelease" INTEGER,
    "ministryRelease" INTEGER,
    "ministryId" UUID,
    "releaseDateTime" TIMESTAMPTZ,
    "publishDateTime" TIMESTAMPTZ,
    "isCommitted" BOOLEAN NOT NULL DEFAULT false,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "publishToWeb" BOOLEAN NOT NULL DEFAULT true,
    "publishToNewsOnDemand" BOOLEAN NOT NULL DEFAULT false,
    "publishToMediaDistribution" BOOLEAN NOT NULL DEFAULT false,
    "hasMediaAssets" BOOLEAN NOT NULL DEFAULT false,
    "nodSubscribers" INTEGER,
    "mediaSubscribers" INTEGER,
    "atomId" VARCHAR(255) NOT NULL DEFAULT '',
    "keywords" TEXT NOT NULL DEFAULT '',
    "assetUrl" TEXT NOT NULL DEFAULT '',
    "redirectUrl" TEXT NOT NULL DEFAULT '',
    "searchVector" tsvector,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "news_release_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "news_release_language" (
    "releaseId" UUID NOT NULL,
    "languageId" VARCHAR(5) NOT NULL,
    "location" VARCHAR(50) NOT NULL DEFAULT '',
    "summary" TEXT NOT NULL DEFAULT '',
    "socialMediaHeadline" TEXT,
    "socialMediaSummary" TEXT,

    CONSTRAINT "news_release_language_pkey" PRIMARY KEY ("releaseId","languageId")
);

-- CreateTable
CREATE TABLE "news_release_document" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "releaseId" UUID NOT NULL,
    "sortIndex" INTEGER NOT NULL DEFAULT 0,
    "pageLayout" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "news_release_document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "news_release_document_language" (
    "documentId" UUID NOT NULL,
    "languageId" VARCHAR(5) NOT NULL,
    "pageTitle" VARCHAR(50) NOT NULL DEFAULT '',
    "organizations" VARCHAR(250) NOT NULL DEFAULT '',
    "headline" VARCHAR(255) NOT NULL DEFAULT '',
    "subheadline" VARCHAR(100) NOT NULL DEFAULT '',
    "byline" VARCHAR(250) NOT NULL DEFAULT '',
    "bodyHtml" TEXT NOT NULL DEFAULT '',

    CONSTRAINT "news_release_document_language_pkey" PRIMARY KEY ("documentId","languageId")
);

-- CreateTable
CREATE TABLE "news_release_document_contact" (
    "documentId" UUID NOT NULL,
    "languageId" VARCHAR(5) NOT NULL,
    "sortIndex" INTEGER NOT NULL,
    "information" VARCHAR(250) NOT NULL,

    CONSTRAINT "news_release_document_contact_pkey" PRIMARY KEY ("documentId","languageId","sortIndex")
);

-- CreateTable
CREATE TABLE "news_release_log" (
    "id" SERIAL NOT NULL,
    "releaseId" UUID NOT NULL,
    "dateTime" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" UUID,
    "description" VARCHAR(200) NOT NULL,

    CONSTRAINT "news_release_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "news_release_image" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "releaseId" UUID NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "fileName" VARCHAR(255) NOT NULL,
    "mimeType" VARCHAR(100) NOT NULL,
    "filePath" VARCHAR(500) NOT NULL,

    CONSTRAINT "news_release_image_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "news_release_image_language" (
    "imageId" UUID NOT NULL,
    "languageId" VARCHAR(5) NOT NULL,
    "alternateName" VARCHAR(100) NOT NULL,

    CONSTRAINT "news_release_image_language_pkey" PRIMARY KEY ("imageId","languageId")
);

-- CreateTable
CREATE TABLE "news_release_history" (
    "releaseId" UUID NOT NULL,
    "publishDateTime" TIMESTAMPTZ NOT NULL,
    "mimeType" VARCHAR(100) NOT NULL,
    "filePath" VARCHAR(500) NOT NULL,

    CONSTRAINT "news_release_history_pkey" PRIMARY KEY ("releaseId","publishDateTime","mimeType")
);

-- CreateTable
CREATE TABLE "news_release_ministry" (
    "releaseId" UUID NOT NULL,
    "ministryId" UUID NOT NULL,

    CONSTRAINT "news_release_ministry_pkey" PRIMARY KEY ("releaseId","ministryId")
);

-- CreateTable
CREATE TABLE "news_release_sector" (
    "releaseId" UUID NOT NULL,
    "sectorId" UUID NOT NULL,

    CONSTRAINT "news_release_sector_pkey" PRIMARY KEY ("releaseId","sectorId")
);

-- CreateTable
CREATE TABLE "news_release_theme" (
    "releaseId" UUID NOT NULL,
    "themeId" UUID NOT NULL,

    CONSTRAINT "news_release_theme_pkey" PRIMARY KEY ("releaseId","themeId")
);

-- CreateTable
CREATE TABLE "news_release_tag" (
    "releaseId" UUID NOT NULL,
    "tagId" UUID NOT NULL,

    CONSTRAINT "news_release_tag_pkey" PRIMARY KEY ("releaseId","tagId")
);

-- CreateTable
CREATE TABLE "news_release_media_distribution" (
    "releaseId" UUID NOT NULL,
    "mediaDistributionListId" UUID NOT NULL,

    CONSTRAINT "news_release_media_distribution_pkey" PRIMARY KEY ("releaseId","mediaDistributionListId")
);

-- CreateTable
CREATE TABLE "user" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "email" VARCHAR(256) NOT NULL,
    "displayName" VARCHAR(256) NOT NULL,
    "passwordHash" VARCHAR(255) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ministry_key_key" ON "ministry"("key");
CREATE UNIQUE INDEX "ministry_displayName_key" ON "ministry"("displayName");
CREATE UNIQUE INDEX "ministry_abbreviation_key" ON "ministry"("abbreviation");
CREATE UNIQUE INDEX "sector_key_key" ON "sector"("key");
CREATE UNIQUE INDEX "theme_key_key" ON "theme"("key");
CREATE UNIQUE INDEX "tag_key_key" ON "tag"("key");
CREATE UNIQUE INDEX "service_key_key" ON "service"("key");
CREATE UNIQUE INDEX "media_distribution_list_key_key" ON "media_distribution_list"("key");
CREATE UNIQUE INDEX "news_release_releaseType_key_key" ON "news_release"("releaseType", "key");
CREATE INDEX "news_release_reference_idx" ON "news_release"("reference");
CREATE INDEX "news_release_isActive_isPublished_idx" ON "news_release"("isActive", "isPublished");
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");

-- Full-text search index
CREATE INDEX "news_release_search_idx" ON "news_release" USING GIN ("searchVector");

-- AddForeignKey
ALTER TABLE "ministry_language" ADD CONSTRAINT "ministry_language_ministryId_fkey" FOREIGN KEY ("ministryId") REFERENCES "ministry"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ministry_language" ADD CONSTRAINT "ministry_language_languageId_fkey" FOREIGN KEY ("languageId") REFERENCES "language"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "sector_language" ADD CONSTRAINT "sector_language_sectorId_fkey" FOREIGN KEY ("sectorId") REFERENCES "sector"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "sector_language" ADD CONSTRAINT "sector_language_languageId_fkey" FOREIGN KEY ("languageId") REFERENCES "language"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ministry_sector" ADD CONSTRAINT "ministry_sector_ministryId_fkey" FOREIGN KEY ("ministryId") REFERENCES "ministry"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ministry_sector" ADD CONSTRAINT "ministry_sector_sectorId_fkey" FOREIGN KEY ("sectorId") REFERENCES "sector"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "news_release" ADD CONSTRAINT "news_release_ministryId_fkey" FOREIGN KEY ("ministryId") REFERENCES "ministry"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "news_release_language" ADD CONSTRAINT "news_release_language_releaseId_fkey" FOREIGN KEY ("releaseId") REFERENCES "news_release"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "news_release_language" ADD CONSTRAINT "news_release_language_languageId_fkey" FOREIGN KEY ("languageId") REFERENCES "language"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "news_release_document" ADD CONSTRAINT "news_release_document_releaseId_fkey" FOREIGN KEY ("releaseId") REFERENCES "news_release"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "news_release_document_language" ADD CONSTRAINT "news_release_document_language_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "news_release_document"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "news_release_document_language" ADD CONSTRAINT "news_release_document_language_languageId_fkey" FOREIGN KEY ("languageId") REFERENCES "language"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "news_release_document_contact" ADD CONSTRAINT "news_release_document_contact_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "news_release_document"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "news_release_document_contact" ADD CONSTRAINT "news_release_document_contact_languageId_fkey" FOREIGN KEY ("languageId") REFERENCES "language"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "news_release_log" ADD CONSTRAINT "news_release_log_releaseId_fkey" FOREIGN KEY ("releaseId") REFERENCES "news_release"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "news_release_image" ADD CONSTRAINT "news_release_image_releaseId_fkey" FOREIGN KEY ("releaseId") REFERENCES "news_release"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "news_release_image_language" ADD CONSTRAINT "news_release_image_language_imageId_fkey" FOREIGN KEY ("imageId") REFERENCES "news_release_image"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "news_release_image_language" ADD CONSTRAINT "news_release_image_language_languageId_fkey" FOREIGN KEY ("languageId") REFERENCES "language"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "news_release_history" ADD CONSTRAINT "news_release_history_releaseId_fkey" FOREIGN KEY ("releaseId") REFERENCES "news_release"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "news_release_ministry" ADD CONSTRAINT "news_release_ministry_releaseId_fkey" FOREIGN KEY ("releaseId") REFERENCES "news_release"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "news_release_ministry" ADD CONSTRAINT "news_release_ministry_ministryId_fkey" FOREIGN KEY ("ministryId") REFERENCES "ministry"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "news_release_sector" ADD CONSTRAINT "news_release_sector_releaseId_fkey" FOREIGN KEY ("releaseId") REFERENCES "news_release"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "news_release_sector" ADD CONSTRAINT "news_release_sector_sectorId_fkey" FOREIGN KEY ("sectorId") REFERENCES "sector"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "news_release_theme" ADD CONSTRAINT "news_release_theme_releaseId_fkey" FOREIGN KEY ("releaseId") REFERENCES "news_release"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "news_release_theme" ADD CONSTRAINT "news_release_theme_themeId_fkey" FOREIGN KEY ("themeId") REFERENCES "theme"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "news_release_tag" ADD CONSTRAINT "news_release_tag_releaseId_fkey" FOREIGN KEY ("releaseId") REFERENCES "news_release"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "news_release_tag" ADD CONSTRAINT "news_release_tag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "news_release_media_distribution" ADD CONSTRAINT "news_release_media_distribution_releaseId_fkey" FOREIGN KEY ("releaseId") REFERENCES "news_release"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "news_release_media_distribution" ADD CONSTRAINT "news_release_media_distribution_mediaDistributionListId_fkey" FOREIGN KEY ("mediaDistributionListId") REFERENCES "media_distribution_list"("id") ON DELETE CASCADE ON UPDATE CASCADE;
