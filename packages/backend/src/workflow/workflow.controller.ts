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

@Controller('releases/:id/workflow')
export class WorkflowController {
  constructor(
    private workflow: WorkflowService,
    private generation: GenerationService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Post('approve')
  approve(@Param('id') id: string, @Request() req: any) {
    return this.workflow.approve(id, req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('schedule')
  schedule(
    @Param('id') id: string,
    @Body() body: { publishDateTime: string },
    @Request() req: any,
  ) {
    return this.workflow.schedule(id, body.publishDateTime, req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('publish')
  publish(@Param('id') id: string, @Request() req: any) {
    return this.workflow.publish(id, req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('unpublish')
  unpublish(@Param('id') id: string, @Request() req: any) {
    return this.workflow.unpublish(id, req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
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
