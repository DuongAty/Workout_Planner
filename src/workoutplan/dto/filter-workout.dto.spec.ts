import { plainToInstance } from 'class-transformer';
import { GetWorkoutFilter } from './filter-workout.dto';
import { validate } from 'class-validator';

describe('Filter Workout', () => {
  it('Validation should be passed when the "search" field is a string.', async () => {
    const data = { search: 'tìm kiếm bài tập' };
    const dto = plainToInstance(GetWorkoutFilter, data);
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('Validation should be passed when the "search" field is omitted (@IsOptional)', async () => {
    const data = {};
    const dto = plainToInstance(GetWorkoutFilter, data);
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });
  it('Validation should fail when the "search" field is not a string.', async () => {
    const data = { search: 12345 };
    const dto = plainToInstance(GetWorkoutFilter, data);
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThanOrEqual(1);
    const searchError = errors.find((e) => e.property === 'search');
    expect(searchError).toBeDefined();
    expect(searchError?.constraints).toHaveProperty('isString');
  });
});
