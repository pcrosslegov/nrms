import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ReleaseType } from '@prisma/client';
import { ReleasesService } from './releases.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('releases')
export class ReleasesController {
  constructor(private releases: ReleasesService) {}

  @Get()
  findAll(
    @Query('tab') tab?: 'drafts' | 'scheduled' | 'published',
    @Query('releaseType') releaseType?: ReleaseType,
    @Query('ministryId') ministryId?: string,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.releases.findAll({
      tab,
      releaseType,
      ministryId,
      search,
      page: page ? parseInt(page, 10) : undefined,
      pageSize: pageSize ? parseInt(pageSize, 10) : undefined,
    });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.releases.findOne(id);
  }

  @Post()
  create(@Body() body: { releaseType?: ReleaseType; ministryId?: string }) {
    return this.releases.create(body);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: any) {
    return this.releases.update(id, body);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.releases.softDelete(id);
  }
}
