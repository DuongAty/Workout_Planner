import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { WorkoutStatus } from '../workout-status';

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
}
