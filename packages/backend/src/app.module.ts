import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { ReferenceDataModule } from './reference-data/reference-data.module';
import { ReleasesModule } from './releases/releases.module';
import { DocumentsModule } from './documents/documents.module';
import { AuditModule } from './audit/audit.module';
import { WorkflowModule } from './workflow/workflow.module';
import { StorageModule } from './storage/storage.module';
import { ImagesModule } from './images/images.module';
import { IntegrationsModule } from './integrations/integrations.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', '..', 'public'),
      exclude: ['/api/{*path}'],
    }),
    PrismaModule,
    AuthModule,
    ReferenceDataModule,
    ReleasesModule,
    DocumentsModule,
    AuditModule,
    WorkflowModule,
    StorageModule,
    ImagesModule,
    IntegrationsModule,
    HealthModule,
  ],
})
export class AppModule {}
