import { validate } from 'class-validator';
import {
  UpdateDaysOfWeekDto,
  UpdateScheduleDto,
  UpdateWorkoutDto,
} from './update-name-dto';
import { plainToInstance } from 'class-transformer';
describe('UpdateWorkoutDto', () => {
  let dto: UpdateWorkoutDto;

  beforeEach(() => {
    dto = new UpdateWorkoutDto();
  });

  it('nên thành công khi dữ liệu hợp lệ (tất cả các trường)', async () => {
    const input = {
      name: '  Workout Buổi Sáng  ',
      startDate: '2026-01-05',
      endDate: '2026-01-12',
      daysOfWeek: [1, 3, 5],
    };
    const ofInstance = plainToInstance(UpdateWorkoutDto, input);
    const errors = await validate(ofInstance);
    expect(errors.length).toBe(0);
    expect(ofInstance.name).toBe('Workout Buổi Sáng');
  });

  it('nên thất bại nếu startDate không đúng định dạng ngày', async () => {
    dto.startDate = '05-01-2026'; // Sai định dạng (phải là YYYY-MM-DD)
    const errors = await validate(dto);

    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('startDate');
  });

  describe('daysOfWeek validation', () => {
    it('nên thất bại nếu mảng chứa số ngoài khoảng 0-6', async () => {
      const input = { daysOfWeek: [1, 7] }; // 7 là không hợp lệ
      const ofInstance = plainToInstance(UpdateWorkoutDto, input);
      const errors = await validate(ofInstance);

      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('daysOfWeek');
    });

    it('nên thất bại nếu mảng có phần tử trùng lặp', async () => {
      const input = { daysOfWeek: [1, 2, 2] };
      const ofInstance = plainToInstance(UpdateWorkoutDto, input);
      const errors = await validate(ofInstance);

      expect(errors.length).toBeGreaterThan(0);
      // Kiểm tra xem lỗi có phải do @ArrayUnique không
      expect(errors[0].constraints).toHaveProperty('arrayUnique');
    });

    it('nên thất bại nếu không phải là mảng', async () => {
      const input = { daysOfWeek: '1,2,3' } as any;
      const ofInstance = plainToInstance(UpdateWorkoutDto, input);
      const errors = await validate(ofInstance);

      expect(errors.length).toBeGreaterThan(0);
    });
  });

  it('nên cho phép để trống (optional) vì đây là Update DTO', async () => {
    const input = { name: 'Chỉ update tên' };
    const ofInstance = plainToInstance(UpdateWorkoutDto, input);
    const errors = await validate(ofInstance);

    expect(errors.length).toBe(0);
    expect(ofInstance.startDate).toBeUndefined();
  });
});

describe('UpdateScheduleDto', () => {
  it('nên thành công khi các trường hợp lệ', async () => {
    const input = { oldDate: '2026-02-20', newDate: '2026-02-21' };
    const dto = plainToInstance(UpdateScheduleDto, input);
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('nên thành công khi chỉ gửi một trường (IsOptional)', async () => {
    const input = { oldDate: '2026-02-20' };
    const dto = plainToInstance(UpdateScheduleDto, input);
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('nên thất bại nếu định dạng ngày không hợp lệ', async () => {
    const input = { oldDate: '20-02-2026', newDate: 'không phải ngày' };
    const dto = plainToInstance(UpdateScheduleDto, input);
    const errors = await validate(dto);

    expect(errors.length).toBeGreaterThan(0);
    // Kiểm tra xem cả 2 trường đều báo lỗi định dạng ngày
    const propertiesWithErrors = errors.map((e) => e.property);
    expect(propertiesWithErrors).toContain('oldDate');
    expect(propertiesWithErrors).toContain('newDate');
  });
});

describe('UpdateDaysOfWeekDto', () => {
  it('nên thành công với mảng số hợp lệ', async () => {
    const input = { daysOfWeek: [0, 2, 4, 6] };
    const dto = plainToInstance(UpdateDaysOfWeekDto, input);
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('nên thất bại nếu daysOfWeek không phải là mảng', async () => {
    const input = { daysOfWeek: 1 }; // Gửi số đơn thay vì mảng
    const dto = plainToInstance(UpdateDaysOfWeekDto, input as any);
    const errors = await validate(dto);

    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].constraints).toHaveProperty('isArray');
  });

  it('nên thất bại nếu một phần tử trong mảng không phải là số', async () => {
    const input = { daysOfWeek: [0, '2', 4] }; // '2' là string
    const dto = plainToInstance(UpdateDaysOfWeekDto, input as any);
    const errors = await validate(dto);

    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].constraints).toHaveProperty('isNumber');
  });

  it('nên thất bại nếu mảng rỗng (nếu bạn muốn bắt buộc có phần tử)', async () => {
    // Lưu ý: DTO hiện tại của bạn không có @ArrayMinSize(1),
    // nên mảng rỗng [] hiện tại vẫn sẽ pass.
    const input = { daysOfWeek: [] };
    const dto = plainToInstance(UpdateDaysOfWeekDto, input);
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });
});
