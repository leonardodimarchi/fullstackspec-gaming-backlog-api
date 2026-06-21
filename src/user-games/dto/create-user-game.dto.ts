import { Type } from 'class-transformer';
import { IsInt } from 'class-validator';

export class CreateUserGameDto {
  @Type(() => Number)
  @IsInt()
  igdbId: number;
}
