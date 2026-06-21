import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { JwtPayloadUser } from '../common/decorators/current-user.decorator';
import { CreateUserGameDto } from './dto/create-user-game.dto';
import { ListUserGamesQueryDto } from './dto/list-user-games-query.dto';
import { UpdateUserGameDto } from './dto/update-user-game.dto';
import { UserGamesService } from './user-games.service';

@Controller('user-games')
@UseGuards(AuthGuard('jwt'))
export class UserGamesController {
  constructor(private readonly userGamesService: UserGamesService) {}

  @Get('counts')
  getCounts(@CurrentUser() user: JwtPayloadUser) {
    return this.userGamesService.getCounts(user.userId);
  }

  @Get()
  findAll(
    @CurrentUser() user: JwtPayloadUser,
    @Query() query: ListUserGamesQueryDto,
  ) {
    return this.userGamesService.findAll(
      user.userId,
      query.page,
      query.limit,
      query.status,
    );
  }

  @Get(':id')
  findOne(@CurrentUser() user: JwtPayloadUser, @Param('id') id: string) {
    return this.userGamesService.findOne(user.userId, id);
  }

  @Post()
  create(@CurrentUser() user: JwtPayloadUser, @Body() dto: CreateUserGameDto) {
    return this.userGamesService.create(user.userId, dto);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: JwtPayloadUser,
    @Param('id') id: string,
    @Body() dto: UpdateUserGameDto,
  ) {
    return this.userGamesService.update(user.userId, id, dto);
  }

  @Delete(':id')
  remove(@CurrentUser() user: JwtPayloadUser, @Param('id') id: string) {
    return this.userGamesService.remove(user.userId, id);
  }
}
