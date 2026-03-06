import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsInt, IsOptional, Min, Max } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

export class CreateSetDto {
  @ApiProperty({
    example: 60.5,
    description: 'Dumbbell weight (kg or lbs)',
    type: Number,
  })
  @IsNumber(
    {},
    { message: i18nValidationMessage('common.validation.IsNumber') },
  )
  @Min(0, { message: i18nValidationMessage('common.validation.Min') })
  @Max(300, { message: i18nValidationMessage('common.validation.Max') })
  weight: number;

  @ApiProperty({
    example: 10,
    description: 'Number of repetitions (reps)',
  })
  @IsInt({ message: i18nValidationMessage('common.validation.IsInt') })
  @Min(1, { message: i18nValidationMessage('common.validation.Min') })
  @Max(15, { message: i18nValidationMessage('common.validation.Max') })
  reps: number;

  @ApiPropertyOptional({
    example: 8.5,
    description: 'RPE (Responsive Performance Index) (1 to 10)',
    type: Number,
  })
  @IsOptional()
  @IsNumber(
    {},
    { message: i18nValidationMessage('common.validation.IsNumber') },
  )
  @Min(1, { message: i18nValidationMessage('common.validation.Min') })
  @Max(10, { message: i18nValidationMessage('common.validation.Max') })
  rpe?: number;
}
