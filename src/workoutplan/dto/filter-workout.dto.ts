import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class GetWorkoutFilter {
  @ApiProperty({
    required: false,
    description: 'Search',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({
    required: false,
    description: 'Number of Exercises',
  })
  @IsOptional()
  numExercises?: string;

  @ApiProperty({
    required: false,
    description: 'Filter by start date (YYYY-MM-DD)',
  })
  @IsOptional()
  @IsString()
  startDate?: string;

  @ApiProperty({
    required: false,
    description: 'Filter by end date (YYYY-MM-DD)',
  })
  @IsOptional()
  @IsString()
  endDate?: string;

  @ApiProperty({
    required: false,
    description: 'Filter by end date (YYYY-MM-DD)',
  })
  @IsOptional()
  @IsString()
  todayOnly?: string;
}
