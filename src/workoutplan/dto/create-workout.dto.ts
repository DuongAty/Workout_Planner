import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsDateString, IsNotEmpty, IsString } from 'class-validator';

export class CreateWorkoutDto {
  @ApiProperty({ example: 'Chest Workout' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: '2026-01-05' })
  @IsDateString()
  startDate: string;

  @ApiProperty({ example: '2026-01-12' })
  @IsDateString()
  endDate: string;

  @ApiProperty({ example: [1, 4], description: '1: Monday, 4: Thursday' })
  @IsArray()
  daysOfWeek: number[];
}
