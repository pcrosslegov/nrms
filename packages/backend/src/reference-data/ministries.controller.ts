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

@Controller('ministries')
export class MinistriesController {
  constructor(private refData: ReferenceDataService) {}

  @Get()
  findAll(@Query('all') all?: string) {
    return this.refData.findAllMinistries(all !== 'true');
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.refData.findMinistry(id);
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  create(
    @Body()
    body: {
      key: string;
      displayName: string;
      abbreviation: string;
      sortOrder?: number;
    },
  ) {
    return this.refData.createMinistry(body);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(@Param('id') id: string, @Body() body: any) {
    return this.refData.updateMinistry(id, body);
  }
}
