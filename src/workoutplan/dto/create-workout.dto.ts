import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { IsFutureDate } from '../common/decorator/is-future-date.decorator';

export class CreateWorkoutDto {
  @ApiProperty({ example: 'Chest Workout' })
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  name: string;

  @ApiProperty({ example: '2026-01-05' })
  @IsDateString()
  startDate: string;

  @ApiProperty({ example: '2026-01-12' })
  @IsDateString()
  @IsFutureDate()
  endDate: string;

  @ApiProperty({ example: [1, 4], description: '1: Monday, 4: Thursday' })
  @IsArray()
  @ArrayUnique()
  @ArrayMinSize(1)
  @IsNumber({}, { each: true })
  @Min(0, { each: true })
  @Max(6, { each: true })
  daysOfWeek: number[];
}
