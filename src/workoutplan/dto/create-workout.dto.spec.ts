import { validate } from 'class-validator';
import { CreateWorkoutDto } from './create-workout.dto';

function futureDate(daysFromNow: number) {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  return d.toISOString().split('T')[0];
}

describe('CreateWorkoutDto', () => {
  it('Validation should pass when the data is valid', async () => {
    const dto = new CreateWorkoutDto();

    dto.name = 'Bài tập Ngực';
    dto.startDate = futureDate(1);
    dto.endDate = futureDate(7);
    dto.daysOfWeek = [1, 4];

    const errors = await validate(dto);

    expect(errors.length).toBe(0);
  });

  it('Validation should fail if the "name" field is left blank', async () => {
    const dto = new CreateWorkoutDto();

    dto.name = '';
    dto.startDate = futureDate(1);
    dto.endDate = futureDate(7);
    dto.daysOfWeek = [1, 4];

    const errors = await validate(dto);

    expect(errors.length).toBeGreaterThan(0);

    const nameError = errors.find((e) => e.property === 'name');
    expect(nameError).toBeDefined();
    expect(nameError?.constraints).toHaveProperty('isNotEmpty');
  });
});
