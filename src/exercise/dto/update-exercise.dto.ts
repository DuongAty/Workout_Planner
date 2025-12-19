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
    description:
      'Sets are groups of reps done consecutively with rest in between',
  })
  sets: number;

  @ApiProperty({
    description: 'Reps is single, full movements of an exercise',
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
