import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';

export class CreateWorkoutDto {
  @IsNotEmpty()
  @ApiProperty({
    description: ' Workout Name',
  })
  name: string;
}
