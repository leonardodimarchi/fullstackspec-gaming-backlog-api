import { IsEnum, IsOptional } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { GameStatus } from '../../common/enums/game-status.enum';

export class ListUserGamesQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsEnum(GameStatus)
  status?: GameStatus;
}
