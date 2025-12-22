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
    description: 'Groups of repetitions',
    example: 3,
  })
  numberOfSets: number;

  @IsInt()
  @Min(1)
  @IsNotEmpty()
  @ApiProperty({
    description: 'Number of repetitions of the movement',
    example: 12,
  })
  repetitions: number;

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
