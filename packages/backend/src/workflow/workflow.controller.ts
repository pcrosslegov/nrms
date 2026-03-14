import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  Request,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Response } from 'express';
import { WorkflowService } from './workflow.service';
import { GenerationService } from '../generation/generation.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../auth/roles.enum';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('releases/:id/workflow')
export class WorkflowController {
  constructor(
    private workflow: WorkflowService,
    private generation: GenerationService,
  ) {}

  @Roles(Role.ADMIN, Role.EDITOR)
  @Post('approve')
  approve(@Param('id') id: string, @Request() req: any) {
    return this.workflow.approve(id, req.user.userId);
  }

  @Roles(Role.ADMIN, Role.EDITOR)
  @Post('schedule')
  schedule(
    @Param('id') id: string,
    @Body() body: { publishDateTime: string },
    @Request() req: any,
  ) {
    return this.workflow.schedule(id, body.publishDateTime, req.user.userId);
  }

  @Roles(Role.ADMIN, Role.EDITOR)
  @Post('publish')
  publish(@Param('id') id: string, @Request() req: any) {
    return this.workflow.publish(id, req.user.userId);
  }

  @Roles(Role.ADMIN, Role.EDITOR)
  @Post('unpublish')
  unpublish(@Param('id') id: string, @Request() req: any) {
    return this.workflow.unpublish(id, req.user.userId);
  }

  @Get('preview')
  preview(@Param('id') id: string) {
    return this.workflow.preview(id);
  }

  @Get('preview/html')
  async previewHtml(@Param('id') id: string, @Res() res: Response) {
    const { html } = await this.workflow.preview(id);
    res.type('text/html').send(html);
  }

  @Get('pdf')
  async generatePdf(@Param('id') id: string, @Res() res: Response) {
    const { html } = await this.workflow.preview(id);
    const pdf = await this.generation.generatePdf(html);
    res.type('application/pdf').send(pdf);
  }
}
