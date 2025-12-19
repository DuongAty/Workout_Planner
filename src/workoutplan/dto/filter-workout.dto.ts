import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class GetWorkoutFilter {
  @ApiProperty({
    required: false,
    description: 'Search',
  })
  @IsOptional()
  @IsString()
  search?: string;
}
