import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

export class AIWorkoutChatDto {
  @ApiProperty({ example: 'create Workout' })
  @IsString({ message: i18nValidationMessage('common.validation.IsString') })
  message: string;
}
