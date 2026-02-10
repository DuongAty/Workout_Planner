import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsInt, IsOptional, Min, Max } from 'class-validator';

export class CreateSetDto {
  @ApiProperty({
    example: 60.5,
    description: 'Dumbbell weight (kg or lbs)',
    type: Number,
  })
  @IsNumber()
  @Min(0)
  @Max(300)
  weight: number;

  @ApiProperty({
    example: 10,
    description: 'Number of repetitions (reps)',
  })
  @IsInt()
  @Min(1)
  @Max(15)
  reps: number;

  @ApiPropertyOptional({
    example: 8.5,
    description: 'RPE (Responsive Performance Index) (1 to 10)',
    type: Number,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(10)
  rpe?: number;
}
