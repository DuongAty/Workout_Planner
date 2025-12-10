import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';

export class CreateWorkoutDto {
  @IsNotEmpty()
  @ApiProperty({
    description: 'Tiêu đề công việc',
  })
  name: string;
}
