import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsNumber, IsOptional, IsString } from 'class-validator';

export class GetWorkoutFilter {
  @ApiProperty({
    required: false,
    description: 'Search workout name',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({
    required: false,
    description: 'Number of exercises',
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  numExercises?: number;

  @ApiProperty({
    required: false,
    description: 'Start date filter',
  })
  @IsOptional()
  @IsString()
  startDate?: string;

  @ApiProperty({
    required: false,
    description: 'End date filter',
  })
  @IsOptional()
  @IsString()
  endDate?: string;

  @ApiProperty({
    required: false,
    description: 'Only today workout',
  })
  @IsOptional()
  @IsString()
  todayOnly?: string;
}
