-- CreateEnum
CREATE TYPE "role" AS ENUM ('ADMIN', 'EDITOR', 'VIEWER');

-- DropIndex
DROP INDEX "news_release_search_idx";

-- AlterTable
ALTER TABLE "media_distribution_list" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "ministry" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "news_release" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "news_release_document" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "news_release_image" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "sector" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "service" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "tag" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "theme" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "user" ADD COLUMN     "role" "role" NOT NULL DEFAULT 'VIEWER',
ALTER COLUMN "id" DROP DEFAULT;
