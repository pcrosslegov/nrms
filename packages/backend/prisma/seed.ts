import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // ─── Languages ──────────────────────────────────────────────────
  await prisma.language.upsert({
    where: { id: 'en' },
    update: {},
    create: { id: 'en', name: 'English', sortOrder: 0 },
  });
  await prisma.language.upsert({
    where: { id: 'fr' },
    update: {},
    create: { id: 'fr', name: 'French', sortOrder: 1 },
  });

  // ─── Ministries (from seed data) ───────────────────────────────
  const ministries = [
    { key: 'office-of-the-premier', displayName: 'Office of the Premier', abbreviation: 'PREM', sortOrder: 0 },
    { key: 'executive-council', displayName: 'Executive Council Office', abbreviation: 'ECO', sortOrder: 5 },
    { key: 'environment-local-government', displayName: 'Department of Environment and Local Government', abbreviation: 'ELG', sortOrder: 10 },
    { key: 'aboriginal-affairs', displayName: 'Department of Aboriginal Affairs', abbreviation: 'AAS', sortOrder: 15 },
    { key: 'agriculture-aquaculture-and-fisheries', displayName: 'Department of Agriculture, Aquaculture and Fisheries', abbreviation: 'AAF', sortOrder: 20 },
    { key: 'economic-development-small-business', displayName: 'Department of Economic Development and Small Business', abbreviation: 'EDSB', sortOrder: 20 },
    { key: 'education-early-childhood-development', displayName: 'Department of Education and Early Childhood Development', abbreviation: 'EECD', sortOrder: 30 },
    { key: 'energy-resource-development', displayName: 'Department of Energy and Resource Development', abbreviation: 'ERD', sortOrder: 40 },
    { key: 'finance', displayName: 'Department of Finance', abbreviation: 'FIN', sortOrder: 50 },
    { key: 'health', displayName: 'Department of Health', abbreviation: 'DH', sortOrder: 60 },
    { key: 'intergovernmental-affairs', displayName: 'Department of Intergovernmental Affairs', abbreviation: 'IGA', sortOrder: 70 },
    { key: 'justice-attorney-general', displayName: 'Department of Justice and Office of the Attorney General', abbreviation: 'JAG', sortOrder: 80 },
    { key: 'post-secondary-education-training-labour', displayName: 'Department of Post-Secondary Education, Training and Labour', abbreviation: 'PETL', sortOrder: 90 },
    { key: 'public-safety', displayName: 'Department of Public Safety', abbreviation: 'DPS', sortOrder: 100 },
    { key: 'social-development', displayName: 'Department of Social Development', abbreviation: 'SD', sortOrder: 110 },
    { key: 'tourism-heritage-culture', displayName: 'Department of Tourism, Heritage and Culture', abbreviation: 'THC', sortOrder: 120 },
    { key: 'transportation-infrastructure', displayName: 'Department of Transportation and Infrastructure', abbreviation: 'DTI', sortOrder: 130 },
    { key: 'gcpe-hq', displayName: 'GCPE HQ', abbreviation: 'GCPEHQ', sortOrder: 180 },
    { key: 'gcpe-media-relations', displayName: 'GCPE Media Relations', abbreviation: 'GCPEMEDIA', sortOrder: 190 },
    { key: 'service-new-brunswick', displayName: 'Department of Service New Brunswick', abbreviation: 'SERVICE', sortOrder: 200 },
  ];

  for (const m of ministries) {
    await prisma.ministry.upsert({
      where: { key: m.key },
      update: { displayName: m.displayName, abbreviation: m.abbreviation, sortOrder: m.sortOrder },
      create: m,
    });
  }

  // Create English ministry language entries
  const allMinistries = await prisma.ministry.findMany();
  for (const m of allMinistries) {
    await prisma.ministryLanguage.upsert({
      where: { ministryId_languageId: { ministryId: m.id, languageId: 'en' } },
      update: { name: m.displayName },
      create: { ministryId: m.id, languageId: 'en', name: m.displayName },
    });
  }

  // ─── Sector ─────────────────────────────────────────────────────
  const sector = await prisma.sector.upsert({
    where: { key: 'government-operations' },
    update: {},
    create: {
      key: 'government-operations',
      displayName: 'Government Operations',
      sortOrder: 0,
    },
  });

  await prisma.sectorLanguage.upsert({
    where: { sectorId_languageId: { sectorId: sector.id, languageId: 'en' } },
    update: {},
    create: { sectorId: sector.id, languageId: 'en', name: 'Government Operations' },
  });

  // Link all ministries to the sector
  for (const m of allMinistries) {
    await prisma.ministrySector.upsert({
      where: { ministryId_sectorId: { ministryId: m.id, sectorId: sector.id } },
      update: {},
      create: { ministryId: m.id, sectorId: sector.id },
    });
  }

  // ─── Theme ──────────────────────────────────────────────────────
  await prisma.theme.upsert({
    where: { key: 'health' },
    update: {},
    create: { key: 'health', displayName: 'Health', sortOrder: 0 },
  });

  // ─── Service ────────────────────────────────────────────────────
  await prisma.service.upsert({
    where: { key: 'municipalities' },
    update: {},
    create: { key: 'municipalities', displayName: 'Municipalities', sortOrder: 0 },
  });

  // ─── Media Distribution List ────────────────────────────────────
  await prisma.mediaDistributionList.upsert({
    where: { key: 'budget' },
    update: {},
    create: { key: 'budget', displayName: 'BUDGET', sortOrder: 0 },
  });

  // ─── Default Admin User ─────────────────────────────────────────
  const passwordHash = await bcrypt.hash('admin123!', 10);
  await prisma.user.upsert({
    where: { email: 'admin@nrms.local' },
    update: {},
    create: {
      email: 'admin@nrms.local',
      displayName: 'Admin',
      passwordHash,
    },
  });

  console.log('Seed completed successfully');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
