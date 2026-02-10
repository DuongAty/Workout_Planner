import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class CreateUserDto {
  @IsString()
  @MinLength(8)
  @MaxLength(20)
  @ApiProperty({
    description: 'Full Name',
  })
  fullname: string;

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
  @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
    message:
      'The password is too weak: It needs to include uppercase letters, lowercase letters, and numbers/special characters.',
  })
  @ApiProperty({
    description: 'Password',
  })
  password: string;
}
