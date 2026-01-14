import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
} from 'class-validator';

export class UpdateNameWorkoutDto {
  @IsNotEmpty()
  @IsOptional()
  @ApiProperty({
    description: 'Name',
  })
  name: string;
}

export class UpdateStatusDto {
  @ApiProperty({ enum: ['planned', 'completed', 'missed'] })
  @IsEnum(['planned', 'completed', 'missed'])
  status: string;
}

export class UpdateScheduleDto {
  @ApiProperty({ example: '2026-01-10', required: false })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiProperty({ example: '2026-01-20', required: false })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}

export class UpdateDaysOfWeekDto {
  @ApiProperty({
    example: [0, 2, 4, 6],
    description: 'The days of the week (0: CN, 1: T2...)',
  })
  @IsArray()
  @IsNumber({}, { each: true })
  daysOfWeek: number[];
}
