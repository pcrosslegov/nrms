import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ReferenceDataService } from './reference-data.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('tags')
export class TagsController {
  constructor(private refData: ReferenceDataService) {}

  @Get()
  findAll(@Query('all') all?: string) {
    return this.refData.findAllTags(all !== 'true');
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() body: { key: string; displayName?: string; sortOrder?: number }) {
    return this.refData.createTag(body);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(@Param('id') id: string, @Body() body: any) {
    return this.refData.updateTag(id, body);
  }
}
