import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsInt,
  Min,
  IsEnum,
  Max,
  MaxLength,
} from 'class-validator';
import { MuscleGroup } from '../exercise-musclegroup';
import { Transform, Type } from 'class-transformer';
import { MAX_TIME, MIN_TIME, trim } from 'src/common/constants/constants';

export class CreateExerciseDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  @Transform(trim)
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
  @Max(5)
  @Type(() => Number)
  @IsNotEmpty()
  @ApiProperty({
    description: 'Groups of repetitions',
    example: 3,
  })
  numberOfSets: number;

  @IsInt()
  @Min(1)
  @Max(15)
  @Type(() => Number)
  @IsNotEmpty()
  @ApiProperty({
    description: 'Number of repetitions of the movement',
    example: 12,
  })
  repetitions: number;

  @IsInt()
  @Min(MIN_TIME)
  @Max(MAX_TIME)
  @Type(() => Number)
  @IsNotEmpty()
  @ApiProperty({
    description: 'Rest time',
    example: 60,
  })
  restTime: number;

  @IsInt()
  @Min(MIN_TIME)
  @Max(MAX_TIME)
  @Type(() => Number)
  @IsNotEmpty()
  @ApiProperty({
    description: 'Total time of exercise',
    example: 300,
  })
  duration: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  @Transform(trim)
  @ApiProperty({
    description: 'Note',
  })
  note?: string;
}
