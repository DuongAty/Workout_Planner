import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsInt, Min, IsEnum } from 'class-validator';
import { MuscleGroup } from '../exercise-musclegroup';

export class CreateExerciseDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: 'Exercies Name',
  })
  name: string;

  @ApiProperty({
    description: 'Muscle Group',
    enum: MuscleGroup,
    required: false,
  })
  @IsNotEmpty()
  @IsEnum(MuscleGroup, {
    message: 'Please select a valid muscle group from the list.',
  })
  muscleGroup?: MuscleGroup;

  @IsInt()
  @Min(1)
  @IsNotEmpty()
  @ApiProperty({
    description:
      'Sets are groups of reps done consecutively with rest in between',
  })
  sets: number;

  @IsInt()
  @IsNotEmpty()
  @ApiProperty({
    description: 'Reps is single, full movements of an exercise',
  })
  reps: number;

  @IsInt()
  @Min(0)
  @IsNotEmpty()
  @ApiProperty({
    description: 'Rest time',
  })
  restTime: number;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: 'Note',
  })
  note?: string;
}
