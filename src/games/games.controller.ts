import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ListGamesQueryDto } from './dto/list-games-query.dto';
import { MetadataQueryDto } from './dto/metadata-query.dto';
import { PopularGamesQueryDto } from './dto/popular-games-query.dto';
import { GamesService } from './games.service';

@Controller('games')
@UseGuards(AuthGuard('jwt'))
export class GamesController {
  constructor(private readonly gamesService: GamesService) {}

  @Get('popular')
  getPopular(@Query() query: PopularGamesQueryDto) {
    return this.gamesService.getPopular(query.limit);
  }

  @Get('metadata/genres')
  getGenres(@Query() query: MetadataQueryDto) {
    return this.gamesService.getGenresMetadata(query.q);
  }

  @Get('metadata/platforms')
  getPlatforms(@Query() query: MetadataQueryDto) {
    return this.gamesService.getPlatformsMetadata(query.q);
  }

  @Get()
  list(@Query() query: ListGamesQueryDto) {
    return this.gamesService.listGames(query);
  }

  @Get(':igdbId')
  getOne(@Param('igdbId', ParseIntPipe) igdbId: number) {
    return this.gamesService.getByIgdbId(igdbId);
  }
}
