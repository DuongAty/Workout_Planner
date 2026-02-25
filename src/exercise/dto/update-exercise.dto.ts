import { ApiProperty } from '@nestjs/swagger';
import { MuscleGroup } from '../exercise-musclegroup';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import {
  MAX_LENGHT,
  MAX_TIME,
  MIN_TIME,
  trim,
} from '../../common/constants/constants';

export class UpdateExerciseDto {
  @Transform(trim)
  @ApiProperty({
    required: false,
    description: 'Exercise Name',
  })
  @IsOptional()
  @IsNotEmpty()
  @IsString()
  @MaxLength(50)
  name?: string;

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
    required: false,
    description: 'Groups of repetitions',
    example: 3,
  })
  @Type(() => Number)
  @IsOptional()
  @Min(1)
  @Max(5)
  numberOfSets: number;

  @ApiProperty({
    required: false,
    description: 'Number of repetitions of the movement',
    example: 12,
  })
  @Type(() => Number)
  @IsOptional()
  @Min(1)
  @Max(15)
  repetitions: number;

  @ApiProperty({
    required: false,
    description: 'Rest time ',
  })
  @Type(() => Number)
  @Min(MIN_TIME)
  @Max(MAX_TIME)
  @IsOptional()
  restTime: number;

  @ApiProperty({
    required: false,
    description: 'Total time of exercise ',
  })
  @Type(() => Number)
  @Min(MIN_TIME)
  @Max(MAX_TIME)
  @IsOptional()
  duration: number;

  @Transform(trim)
  @ApiProperty({
    required: false,
    description: 'Note',
  })
  @IsOptional()
  @IsNotEmpty()
  @MaxLength(MAX_LENGHT)
  note: string;
}
