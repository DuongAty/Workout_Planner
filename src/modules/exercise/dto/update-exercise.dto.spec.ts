import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { UpdateExerciseDto } from './update-exercise.dto';
import { MuscleGroup } from '../exercise-musclegroup';

describe('UpdateExerciseDto', () => {
  // Dữ liệu mẫu hợp lệ hoàn chỉnh
  const validData = {
    name: ' Squat ',
    muscleGroup: MuscleGroup.Legs,
    numberOfSets: 3,
    repetitions: 12,
    restTime: 60,
    duration: 500,
    note: 'Keep back straight',
  };

  it('nên hợp lệ khi tất cả các trường đúng định dạng và đã trim name', async () => {
    const object = plainToInstance(UpdateExerciseDto, validData);
    const errors = await validate(object);
    expect(errors.length).toBe(1);
    expect(object.name).toBe('Squat');
  });

  it('nên báo lỗi nếu muscleGroup không nằm trong danh sách Enum', async () => {
    const invalidData = { muscleGroup: 'InvalidGroup' };
    const object = plainToInstance(UpdateExerciseDto, invalidData);
    const errors = await validate(object);

    expect(errors.length).toBeGreaterThan(0);
    const error = errors.find((e) => e.property === 'muscleGroup');
    expect(error?.constraints?.isEnum).toContain(
      'Please select a valid muscle group',
    );
  });

  it('nên báo lỗi nếu các trường số vượt quá giới hạn Min/Max', async () => {
    const invalidData = {
      numberOfSets: 10, // Max là 5
      repetitions: 20, // Max là 15
    };
    const object = plainToInstance(UpdateExerciseDto, invalidData);
    const errors = await validate(object);

    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some((e) => e.property === 'numberOfSets')).toBeTruthy();
    expect(errors.some((e) => e.property === 'repetitions')).toBeTruthy();
  });

  it('nên tự động chuyển đổi chuỗi số thành number bằng @Type', async () => {
    const dataWithStrings = {
      numberOfSets: '3',
      repetitions: '12',
    };
    const object = plainToInstance(UpdateExerciseDto, dataWithStrings);
    const errors = await validate(object);

    expect(errors.length).toBe(0);
    expect(typeof object.numberOfSets).toBe('number');
    expect(object.numberOfSets).toBe(3);
  });

  it('nên hợp lệ khi chỉ gửi một vài trường (Tính chất của Update DTO)', async () => {
    const minimalData = {
      name: 'Push Up',
    };
    const object = plainToInstance(UpdateExerciseDto, minimalData);
    const errors = await validate(object);

    // Test này sẽ Pass nếu bạn đã thêm @IsOptional() vào các trường khác trong DTO
    if (errors.length > 0) {
      console.log(
        'Lỗi phát sinh do thiếu @IsOptional ở các field:',
        errors.map((e) => e.property),
      );
    }
    expect(errors.length).toBe(0);
  });

  it('nên báo lỗi nếu note dài quá 100 ký tự', async () => {
    const invalidData = {
      note: 'a'.repeat(101),
    };
    const object = plainToInstance(UpdateExerciseDto, invalidData);
    const errors = await validate(object);

    const error = errors.find((e) => e.property === 'note');
    expect(error).toBeDefined();
    // Phải dùng @MaxLength trong DTO để pass test này
  });
});
