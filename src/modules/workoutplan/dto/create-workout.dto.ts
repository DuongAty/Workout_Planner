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
  MaxLength,
  Min,
} from 'class-validator';
import { IsFutureDate } from '../../../decorators/is-future-date.decorator';
import { trim } from 'src/constants/constants';

export class CreateWorkoutDto {
  @ApiProperty({ example: 'Chest Workout' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  @Transform(trim)
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
