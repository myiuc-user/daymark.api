import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { SearchService } from './search.service';
import { JwtGuard } from '../common/guards/jwt.guard';

@Controller('search')
@UseGuards(JwtGuard)
export class SearchController {
  constructor(private searchService: SearchService) {}

  @Get()
  search(@Query('q') query: string) {
    return this.searchService.search(query);
  }
}
