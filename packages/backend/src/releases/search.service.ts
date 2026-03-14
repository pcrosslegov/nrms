import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SearchService {
  constructor(private prisma: PrismaService) {}

  async updateSearchVector(releaseId: string) {
    // Build tsvector from release headline, summary, body, keywords
    await this.prisma.$executeRawUnsafe(`
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
        WHERE nr.id = $1::uuid
        LIMIT 1
      )
      WHERE id = $1::uuid
    `, releaseId);
  }

  async search(query: string, page = 1, pageSize = 25) {
    const skip = (page - 1) * pageSize;

    // Use plainto_tsquery for user-friendly search (no need for special syntax)
    const items = await this.prisma.$queryRawUnsafe<any[]>(`
      SELECT
        nr.id, nr."releaseType", nr.key, nr.reference,
        nr."isCommitted", nr."isPublished", nr."releaseDateTime",
        nr."publishDateTime", nr."updatedAt",
        m."displayName" as "ministryName", m."abbreviation" as "ministryAbbreviation",
        nrdl."headline",
        ts_rank(nr."searchVector", plainto_tsquery('english', $1)) as rank
      FROM news_release nr
      LEFT JOIN ministry m ON m.id = nr."ministryId"
      LEFT JOIN news_release_document nrd ON nrd."releaseId" = nr.id AND nrd."sortIndex" = 0
      LEFT JOIN news_release_document_language nrdl ON nrdl."documentId" = nrd.id AND nrdl."languageId" = 'en'
      WHERE nr."isActive" = true
        AND nr."searchVector" @@ plainto_tsquery('english', $1)
      ORDER BY rank DESC, nr."updatedAt" DESC
      LIMIT $2 OFFSET $3
    `, query, pageSize, skip);

    const countResult = await this.prisma.$queryRawUnsafe<{ count: bigint }[]>(`
      SELECT count(*) as count
      FROM news_release
      WHERE "isActive" = true
        AND "searchVector" @@ plainto_tsquery('english', $1)
    `, query);

    const total = Number(countResult[0]?.count ?? 0);

    return {
      items,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }
}
