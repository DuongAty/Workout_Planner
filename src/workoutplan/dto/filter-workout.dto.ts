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
    enum: WorkoutStatus,
    required: false,
    description: 'Workout Status',
  })
  @IsOptional()
  @IsEnum(WorkoutStatus)
  status?: WorkoutStatus;
}
