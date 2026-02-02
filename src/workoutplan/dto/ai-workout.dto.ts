import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class AIWorkoutChatDto {
  @ApiProperty({ example: 'create Workout' })
  @IsString()
  message: string;
}
