import { IsOptional, IsString } from 'class-validator';

export class MetadataQueryDto {
  @IsOptional()
  @IsString()
  q?: string;
}
