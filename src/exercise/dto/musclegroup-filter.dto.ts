import { ApiProperty } from '@nestjs/swagger';
import { MuscleGroup } from '../exercise-musclegroup';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export class GetExerciseFilter {
  @ApiProperty({
    enum: MuscleGroup,
    required: false,
    description: 'Muscle Group',
  })
  @IsOptional()
  @IsEnum(MuscleGroup)
  muscleGroup?: MuscleGroup;

  @ApiProperty({
    required: false,
    description: 'Search',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({
    required: false,
    description: 'Total time of exercise',
  })
  @IsOptional()
  duration?: string;
}
