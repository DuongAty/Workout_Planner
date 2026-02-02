import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class LogMealDto {
  @ApiProperty({
    example: 'Sáng nay tôi ăn 1 bát phở bò và 1 quả trứng trần',
    description: 'Mô tả bữa ăn của bạn',
  })
  @IsString()
  @IsNotEmpty()
  meal: string;
}
