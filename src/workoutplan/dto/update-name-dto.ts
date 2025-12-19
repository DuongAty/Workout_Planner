import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';

export class UpdateNameWorkoutDto {
  @IsNotEmpty()
  @ApiProperty({
    description: 'Name',
  })
  name: string;
}
