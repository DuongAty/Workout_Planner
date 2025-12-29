import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsInt,
  Min,
  IsEnum,
  IsOptional,
} from 'class-validator';
import { MuscleGroup } from '../exercise-musclegroup';
import { Type } from 'class-transformer';

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
  @Type(() => Number)
  @IsNotEmpty()
  @ApiProperty({
    description: 'Groups of repetitions',
    example: 3,
  })
  numberOfSets: number;

  @IsInt()
  @Min(1)
  @Type(() => Number)
  @IsNotEmpty()
  @ApiProperty({
    description: 'Number of repetitions of the movement',
    example: 12,
  })
  repetitions: number;

  @IsInt()
  @Min(0)
  @Type(() => Number)
  @IsNotEmpty()
  @ApiProperty({
    description: 'Rest time',
  })
  restTime: number;
  @IsInt()
  @Type(() => Number)
  @IsNotEmpty()
  @ApiProperty({
    description: 'Total time of exercise',
  })
  duration: number;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: 'Note',
  })
  note?: string;
}
