import { validate } from 'class-validator';
import { MuscleGroup } from '../exercise-musclegroup';
import { GetExerciseFilter } from './musclegroup-filter.dto';
import { plainToInstance } from 'class-transformer';

describe('GetExerciseFilter DTO', () => {
  it('should pass validation when muscleGroup is a valid enum value', async () => {
    const dto = new GetExerciseFilter();
    dto.muscleGroup = MuscleGroup.Chest;
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });
  it('should fail validation when muscleGroup is NOT a valid enum value', async () => {
    const dto = new GetExerciseFilter();
    dto.muscleGroup = 'INVALID_MUSCLE_GROUP';
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    const muscleGroupError = errors.find((e) => e.property === 'muscleGroup');
    expect(muscleGroupError).toBeDefined();
    expect(muscleGroupError?.constraints).toHaveProperty('isEnum');
  });
  it('Validation should fail when the "search" field is not a string.', async () => {
    const data = { search: 12345 };
    const dto = plainToInstance(GetExerciseFilter, data);
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThanOrEqual(1);
    const searchError = errors.find((e) => e.property === 'search');
    expect(searchError).toBeDefined();
    expect(searchError?.constraints).toHaveProperty('isString');
  });
});
