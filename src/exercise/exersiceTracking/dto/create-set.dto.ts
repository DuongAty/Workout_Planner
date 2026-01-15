import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsInt, IsOptional, Min, Max } from 'class-validator';

export class CreateSetDto {
  @ApiProperty({
    example: 60.5,
    description: 'Trọng lượng tạ (kg hoặc lbs)',
    type: Number,
  })
  @IsNumber()
  @Min(0)
  weight: number;

  @ApiProperty({
    example: 10,
    description: 'Số lần lặp lại (reps)',
  })
  @IsInt()
  @Min(1)
  reps: number;

  @ApiPropertyOptional({
    example: 8.5,
    description: 'Chỉ số nỗ lực RPE (từ 1 đến 10)',
    type: Number,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(10)
  rpe?: number;
}
