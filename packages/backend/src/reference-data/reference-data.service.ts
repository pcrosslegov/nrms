import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReferenceDataService {
  constructor(private prisma: PrismaService) {}

  // ─── Ministries ─────────────────────────────────────────────────

  findAllMinistries(activeOnly = true) {
    return this.prisma.ministry.findMany({
      where: activeOnly ? { isActive: true } : undefined,
      orderBy: { sortOrder: 'asc' },
      include: { languages: true },
    });
  }

  findMinistry(id: string) {
    return this.prisma.ministry.findUniqueOrThrow({
      where: { id },
      include: { languages: true, sectors: { include: { sector: true } } },
    });
  }

  createMinistry(data: {
    key: string;
    displayName: string;
    abbreviation: string;
    sortOrder?: number;
    isActive?: boolean;
  }) {
    return this.prisma.ministry.create({ data });
  }

  updateMinistry(
    id: string,
    data: Partial<{
      key: string;
      displayName: string;
      abbreviation: string;
      sortOrder: number;
      isActive: boolean;
    }>,
  ) {
    return this.prisma.ministry.update({ where: { id }, data });
  }

  // ─── Sectors ────────────────────────────────────────────────────

  findAllSectors(activeOnly = true) {
    return this.prisma.sector.findMany({
      where: activeOnly ? { isActive: true } : undefined,
      orderBy: { sortOrder: 'asc' },
    });
  }

  findSector(id: string) {
    return this.prisma.sector.findUniqueOrThrow({ where: { id } });
  }

  createSector(data: {
    key: string;
    displayName?: string;
    sortOrder?: number;
    isActive?: boolean;
  }) {
    return this.prisma.sector.create({ data });
  }

  updateSector(
    id: string,
    data: Partial<{
      key: string;
      displayName: string;
      sortOrder: number;
      isActive: boolean;
    }>,
  ) {
    return this.prisma.sector.update({ where: { id }, data });
  }

  // ─── Themes ─────────────────────────────────────────────────────

  findAllThemes(activeOnly = true) {
    return this.prisma.theme.findMany({
      where: activeOnly ? { isActive: true } : undefined,
      orderBy: { sortOrder: 'asc' },
    });
  }

  findTheme(id: string) {
    return this.prisma.theme.findUniqueOrThrow({ where: { id } });
  }

  createTheme(data: {
    key: string;
    displayName?: string;
    sortOrder?: number;
    isActive?: boolean;
  }) {
    return this.prisma.theme.create({ data });
  }

  updateTheme(
    id: string,
    data: Partial<{
      key: string;
      displayName: string;
      sortOrder: number;
      isActive: boolean;
    }>,
  ) {
    return this.prisma.theme.update({ where: { id }, data });
  }

  // ─── Tags ───────────────────────────────────────────────────────

  findAllTags(activeOnly = true) {
    return this.prisma.tag.findMany({
      where: activeOnly ? { isActive: true } : undefined,
      orderBy: { sortOrder: 'asc' },
    });
  }

  createTag(data: {
    key: string;
    displayName?: string;
    sortOrder?: number;
    isActive?: boolean;
  }) {
    return this.prisma.tag.create({ data });
  }

  updateTag(
    id: string,
    data: Partial<{
      key: string;
      displayName: string;
      sortOrder: number;
      isActive: boolean;
    }>,
  ) {
    return this.prisma.tag.update({ where: { id }, data });
  }

  // ─── Media Distribution Lists ──────────────────────────────────

  findAllMediaDistributions() {
    return this.prisma.mediaDistributionList.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });
  }

  // ─── Languages ──────────────────────────────────────────────────

  findAllLanguages() {
    return this.prisma.language.findMany({ orderBy: { sortOrder: 'asc' } });
  }
}
