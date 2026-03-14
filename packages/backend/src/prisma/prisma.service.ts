import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  async onModuleInit() {
    await this.$connect();
    await this.seedIfEmpty();
    await this.ensureAdminRole();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  private async seedIfEmpty() {
    const count = await this.language.count();
    if (count > 0) return;

    this.logger.log('Empty database — running seed...');

    await this.language.createMany({
      data: [
        { id: 'en', name: 'English', sortOrder: 0 },
        { id: 'fr', name: 'French', sortOrder: 1 },
      ],
      skipDuplicates: true,
    });

    const ministries = [
      { key: 'office-of-the-premier', displayName: 'Office of the Premier', abbreviation: 'PREM', sortOrder: 0 },
      { key: 'executive-council', displayName: 'Executive Council Office', abbreviation: 'ECO', sortOrder: 5 },
      { key: 'environment-local-government', displayName: 'Department of Environment and Local Government', abbreviation: 'ELG', sortOrder: 10 },
      { key: 'aboriginal-affairs', displayName: 'Department of Aboriginal Affairs', abbreviation: 'AAS', sortOrder: 15 },
      { key: 'agriculture-aquaculture-and-fisheries', displayName: 'Department of Agriculture, Aquaculture and Fisheries', abbreviation: 'AAF', sortOrder: 20 },
      { key: 'education-early-childhood-development', displayName: 'Department of Education and Early Childhood Development', abbreviation: 'EECD', sortOrder: 30 },
      { key: 'energy-resource-development', displayName: 'Department of Energy and Resource Development', abbreviation: 'ERD', sortOrder: 40 },
      { key: 'finance', displayName: 'Department of Finance', abbreviation: 'FIN', sortOrder: 50 },
      { key: 'health', displayName: 'Department of Health', abbreviation: 'DH', sortOrder: 60 },
      { key: 'justice-attorney-general', displayName: 'Department of Justice and Office of the Attorney General', abbreviation: 'JAG', sortOrder: 80 },
      { key: 'public-safety', displayName: 'Department of Public Safety', abbreviation: 'DPS', sortOrder: 100 },
      { key: 'social-development', displayName: 'Department of Social Development', abbreviation: 'SD', sortOrder: 110 },
      { key: 'transportation-infrastructure', displayName: 'Department of Transportation and Infrastructure', abbreviation: 'DTI', sortOrder: 130 },
    ];

    for (const m of ministries) {
      await this.ministry.upsert({ where: { key: m.key }, update: {}, create: m });
    }

    await this.sector.upsert({
      where: { key: 'government-operations' },
      update: {},
      create: { key: 'government-operations', displayName: 'Government Operations', sortOrder: 0 },
    });

    await this.theme.upsert({
      where: { key: 'health' },
      update: {},
      create: { key: 'health', displayName: 'Health', sortOrder: 0 },
    });

    await this.mediaDistributionList.upsert({
      where: { key: 'budget' },
      update: {},
      create: { key: 'budget', displayName: 'BUDGET', sortOrder: 0 },
    });

    const passwordHash = await bcrypt.hash('admin123!', 10);
    await this.user.upsert({
      where: { email: 'admin@nrms.local' },
      update: {},
      create: { email: 'admin@nrms.local', displayName: 'Admin', passwordHash, role: 'ADMIN' },
    });

    this.logger.log('Seed completed');
  }

  private async ensureAdminRole() {
    const passwordHash = await bcrypt.hash('admin123!', 10);
    await this.user.upsert({
      where: { email: 'admin@nrms.local' },
      update: { role: 'ADMIN' },
      create: { email: 'admin@nrms.local', displayName: 'Admin', passwordHash, role: 'ADMIN' },
    });
  }
}
