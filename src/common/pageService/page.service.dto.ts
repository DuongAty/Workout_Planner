import { IsOptional, IsString } from 'class-validator';

export class BaseFilterDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  page?: number;

  @IsOptional()
  limit?: number;
}
