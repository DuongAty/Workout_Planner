import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsString, IsNotEmpty } from 'class-validator';
import { trim } from 'src/constants/constants';

export class LogMealDto {
  @ApiProperty({
    example: 'Sáng nay tôi ăn 1 bát phở bò và 1 quả trứng trần',
    description: 'Mô tả bữa ăn của bạn',
  })
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  meal: string;
}
