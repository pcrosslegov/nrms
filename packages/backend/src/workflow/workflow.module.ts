import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { WorkflowController } from './workflow.controller';
import { WorkflowService } from './workflow.service';
import { PublishCronService } from './publish-cron.service';
import { GenerationModule } from '../generation/generation.module';

@Module({
  imports: [ScheduleModule.forRoot(), GenerationModule],
  controllers: [WorkflowController],
  providers: [WorkflowService, PublishCronService],
  exports: [WorkflowService],
})
export class WorkflowModule {}
