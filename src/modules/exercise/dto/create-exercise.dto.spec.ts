import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { CreateExerciseDto } from './create-exercise.dto';
import { MuscleGroup } from '../exercise-musclegroup';

describe('CreateExerciseDto', () => {
  // Tạo dữ liệu mẫu chuẩn để dùng lại cho các test case bên dưới
  const baseValidData = {
    name: 'Push Up',
    muscleGroup: MuscleGroup.Chest,
    numberOfSets: 3,
    repetitions: 12,
    restTime: 60,
    duration: 300,
    note: 'Keep core tight',
  };

  it('nên vượt qua validation khi dữ liệu đầy đủ và hợp lệ', async () => {
    const object = plainToInstance(CreateExerciseDto, baseValidData);
    const errors = await validate(object);
    expect(errors.length).toBe(0);
  });

  describe('Validation cho từng biến', () => {
    it('nên báo lỗi nếu "name" để trống', async () => {
      // Spread baseValidData và ghi đè name để tránh lỗi thiếu các trường bắt buộc khác
      const invalidData = { ...baseValidData, name: '' };
      const object = plainToInstance(CreateExerciseDto, invalidData);
      const errors = await validate(object);

      const nameError = errors.find((e) => e.property === 'name');
      expect(nameError).toBeDefined();
      expect(nameError?.constraints).toHaveProperty('isNotEmpty');
    });

    it('nên báo lỗi nếu "muscleGroup" không hợp lệ', async () => {
      const invalidData = { ...baseValidData, muscleGroup: 'InvalidGroup' };
      const object = plainToInstance(CreateExerciseDto, invalidData);
      const errors = await validate(object);

      const error = errors.find((e) => e.property === 'muscleGroup');
      expect(error).toBeDefined();
      expect(JSON.stringify(error?.constraints)).toContain(
        'Please select a valid muscle group',
      );
    });

    it('nên báo lỗi nếu "numberOfSets" nhỏ hơn 1', async () => {
      const invalidData = { ...baseValidData, numberOfSets: 0 };
      const object = plainToInstance(CreateExerciseDto, invalidData);
      const errors = await validate(object);

      const error = errors.find((e) => e.property === 'numberOfSets');
      expect(error).toBeDefined();
      expect(error?.constraints).toHaveProperty('min');
    });

    it('nên báo lỗi nếu "repetitions" vượt quá Max (15)', async () => {
      const invalidData = { ...baseValidData, repetitions: 20 };
      const object = plainToInstance(CreateExerciseDto, invalidData);
      const errors = await validate(object);

      const error = errors.find((e) => e.property === 'repetitions');
      expect(error).toBeDefined();
      expect(error?.constraints).toHaveProperty('max');
    });

    it('nên tự động chuyển đổi chuỗi số thành kiểu number và pass validation', async () => {
      const dataWithStrings = {
        ...baseValidData,
        numberOfSets: '5',
        repetitions: '10',
        restTime: '120',
        duration: '400',
      };

      const object = plainToInstance(CreateExerciseDto, dataWithStrings);
      const errors = await validate(object);

      // Nếu fail ở đây, hãy chắc chắn @Type(() => Number) đã được import đúng
      expect(errors.length).toBe(0);
      expect(typeof object.numberOfSets).toBe('number');
      expect(object.numberOfSets).toBe(5);
    });

    it('nên báo lỗi nếu "note" dài hơn 100 ký tự', async () => {
      const invalidData = {
        ...baseValidData,
        note: 'a'.repeat(101),
      };
      const object = plainToInstance(CreateExerciseDto, invalidData);
      const errors = await validate(object);

      const error = errors.find((e) => e.property === 'note');
      expect(error).toBeDefined();
      // Lưu ý: Trong DTO của bạn note đang dùng @Max(100) cho IsString,
      // chính xác nên là @MaxLength(100)
    });
  });
});
