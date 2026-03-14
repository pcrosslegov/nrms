import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { SearchService } from './search.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('search')
export class SearchController {
  constructor(private search: SearchService) {}

  @Get()
  searchReleases(
    @Query('q') query: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.search.search(
      query ?? '',
      page ? parseInt(page, 10) : 1,
      pageSize ? parseInt(pageSize, 10) : 25,
    );
  }
}
