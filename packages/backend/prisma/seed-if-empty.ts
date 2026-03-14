import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const count = await prisma.language.count();
  if (count > 0) {
    console.log('Database already seeded — skipping');
    return;
  }
  console.log('Empty database detected — running seed...');
  // Dynamic import to run the seed script
  await import('./seed');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
