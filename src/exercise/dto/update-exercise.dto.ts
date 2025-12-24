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
    description: 'Groups of repetitions',
    example: 3,
  })
  numberOfSets: number;

  @ApiProperty({
    description: 'Number of repetitions of the movement',
    example: 12,
  })
  repetitions: number;

  @ApiProperty({
    description: 'Rest time ',
  })
  restTime: number;

  @ApiProperty({
    description: 'Note',
  })
  note: string;
}
