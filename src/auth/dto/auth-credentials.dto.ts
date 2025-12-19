import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class AuthCredentialsDto {
  @IsString()
  @MinLength(8)
  @MaxLength(20)
  @ApiProperty({
    description: 'User Name',
  })
  username: string;

  @IsString()
  @MinLength(8)
  @MaxLength(20)
  @ApiProperty({
    description: 'Passwoord',
  })
  password: string;
}
