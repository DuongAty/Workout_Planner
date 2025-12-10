import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsInt, Min, IsEnum } from 'class-validator';
import { MuscleGroup } from '../exercise-musclegroup';

export class CreateExerciseDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: 'Tên Exercies',
  })
  name: string;

  @ApiProperty({
    description: 'Nhóm cơ',
    enum: MuscleGroup,
    required: false,
  })
  @IsNotEmpty()
  @IsEnum(MuscleGroup, {
    message: 'Vui lòng chọn một nhóm cơ hợp lệ từ danh sách',
  })
  muscleGroup?: MuscleGroup;

  @IsInt()
  @Min(1)
  @IsNotEmpty()
  @ApiProperty({
    description: 'Sets',
  })
  sets: number;

  @IsInt()
  @IsNotEmpty()
  @ApiProperty({
    description: 'Reps',
  })
  reps: number;

  @IsInt()
  @Min(0)
  @IsNotEmpty()
  @ApiProperty({
    description: 'Rest time',
  })
  restTime: number;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: 'Note',
  })
  note?: string;
}
