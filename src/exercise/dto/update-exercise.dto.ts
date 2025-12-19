import { ApiProperty } from '@nestjs/swagger';
import { MuscleGroup } from '../exercise-musclegroup';
import { IsEnum, IsOptional } from 'class-validator';

export class UpdateExerciseDto {
  @ApiProperty({
    description: 'Tên',
  })
  name: string;

  @IsEnum(MuscleGroup, {
    message: 'Vui lòng chọn một nhóm cơ',
  })
  @ApiProperty({
    description: 'Nhóm cơ',
    enum: MuscleGroup,
    required: false,
  })
  @IsOptional()
  @IsEnum(MuscleGroup, {
    message: 'Vui lòng chọn một nhóm cơ hợp lệ từ danh sách',
  })
  muscleGroup?: MuscleGroup;

  @ApiProperty({
    description: 'Số sets',
  })
  sets: number;

  @ApiProperty({
    description: 'Số reps',
  })
  reps: number;

  @ApiProperty({
    description: 'Thời gian nghỉ (s)',
  })
  restTime: number;

  @ApiProperty({
    description: 'Note',
  })
  note: string;
}
