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

@Controller('themes')
export class ThemesController {
  constructor(private refData: ReferenceDataService) {}

  @Get()
  findAll(@Query('all') all?: string) {
    return this.refData.findAllThemes(all !== 'true');
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.refData.findTheme(id);
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() body: { key: string; displayName?: string; sortOrder?: number }) {
    return this.refData.createTheme(body);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(@Param('id') id: string, @Body() body: any) {
    return this.refData.updateTheme(id, body);
  }
}
