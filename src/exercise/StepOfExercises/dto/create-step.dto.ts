import { Transform } from 'class-transformer';
import { IsNotEmpty, IsNumber, MaxLength } from 'class-validator';
import { MAX_LENGHT, trim } from 'src/common/constants/constants';

export class CreateStepDto {
  @IsNotEmpty()
  @IsNumber()
  order: number;

  @MaxLength(MAX_LENGHT)
  @IsNotEmpty()
  @Transform(trim)
  description: string;
}

export class UpdateStepDto {
  @MaxLength(MAX_LENGHT)
  @Transform(trim)
  description: string;
}
