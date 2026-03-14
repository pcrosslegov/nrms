import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { DocumentsService } from './documents.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('releases/:releaseId/documents')
export class DocumentsController {
  constructor(private documents: DocumentsService) {}

  @Get()
  findAll(@Param('releaseId') releaseId: string) {
    return this.documents.findByRelease(releaseId);
  }

  @Post()
  createDocument(
    @Param('releaseId') releaseId: string,
    @Body() body: { sortIndex?: number; pageLayout?: number },
  ) {
    return this.documents.createDocument(releaseId, body);
  }

  @Get(':docId')
  findOne(@Param('docId') docId: string) {
    return this.documents.findOne(docId);
  }

  @Delete(':docId')
  deleteDocument(@Param('docId') docId: string) {
    return this.documents.deleteDocument(docId);
  }

  @Put(':docId/languages/:langId')
  updateLanguage(
    @Param('docId') docId: string,
    @Param('langId') langId: string,
    @Body()
    body: {
      pageTitle?: string;
      organizations?: string;
      headline?: string;
      subheadline?: string;
      byline?: string;
      bodyHtml?: string;
    },
  ) {
    return this.documents.updateLanguage(docId, langId, body);
  }

  @Delete(':docId/languages/:langId')
  deleteLanguage(
    @Param('docId') docId: string,
    @Param('langId') langId: string,
  ) {
    return this.documents.deleteLanguage(docId, langId);
  }

  @Put(':docId/languages/:langId/contacts')
  setContacts(
    @Param('docId') docId: string,
    @Param('langId') langId: string,
    @Body() body: { contacts: string[] },
  ) {
    return this.documents.setContacts(docId, langId, body.contacts);
  }
}
