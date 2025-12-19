import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';

export class CreateWorkoutDto {
  @IsNotEmpty()
  @ApiProperty({
    description: 'Tên Workout',
  })
  name: string;
}
