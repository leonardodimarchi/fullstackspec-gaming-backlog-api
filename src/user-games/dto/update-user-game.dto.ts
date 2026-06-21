import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { Availability } from '../../common/enums/availability.enum';
import { FinishedType } from '../../common/enums/finished-type.enum';
import { GameStatus } from '../../common/enums/game-status.enum';

export class UpdateUserGameDto {
  @IsOptional()
  @IsEnum(GameStatus)
  status?: GameStatus;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @Type(() => Number)
  @Min(0)
  expectedTime?: number;

  @IsOptional()
  @Type(() => Number)
  @Min(0)
  expectedTimeForAllContent?: number;

  @IsOptional()
  @Type(() => Number)
  @Min(0)
  playedTime?: number;

  @IsOptional()
  @Type(() => Number)
  @Min(0)
  playedTimeForAllContent?: number;

  @IsOptional()
  @IsEnum(FinishedType)
  finishedType?: FinishedType;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsDateString()
  endDateForAllContent?: string;

  @IsOptional()
  @IsEnum(Availability)
  availability?: Availability;
}
