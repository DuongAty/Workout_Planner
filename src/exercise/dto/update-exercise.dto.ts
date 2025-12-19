import { ApiProperty } from '@nestjs/swagger';
import { MuscleGroup } from '../exercise-musclegroup';
import { IsEnum, IsOptional } from 'class-validator';

export class UpdateExerciseDto {
  @ApiProperty({
    description: 'Exercise Name',
  })
  name: string;

  @ApiProperty({
    description: 'Muscle Group',
    enum: MuscleGroup,
    required: false,
  })
  @IsOptional()
  @IsEnum(MuscleGroup, {
    message: 'Please select a valid muscle group from the list.',
  })
  muscleGroup?: MuscleGroup;

  @ApiProperty({
    description: 'Number of sets',
    example: 3,
  })
  sets: number;

  @ApiProperty({
    description: 'Number of repetitions per set',
    example: 12,
  })
  reps: number;

  @ApiProperty({
    description: 'Rest time ',
  })
  restTime: number;

  @ApiProperty({
    description: 'Note',
  })
  note: string;
}
