import { MuscleGroup } from '../exercise-musclegroup';
import { validate } from 'class-validator';
import { CreateExerciseDto } from './create-exercise.dto';
describe('Create Exercise Dto', () => {
  const mockExersisedto = {
    name: 'Dumbbell Bench Press',
    muscleGroup: MuscleGroup.Chest,
    sets: 4,
    reps: 10,
    restTime: 90,
    note: 'Focus on slow negative',
  };
  it('Validation should be passed when the data is valid.', async () => {
    const dto = new CreateExerciseDto();
    Object.assign(dto, mockExersisedto);
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });
  it('The authentication process will fail if the "name" field is left blank.', async () => {
    const dto = new CreateExerciseDto();
    dto.name = '';
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThanOrEqual(1);
    expect(errors.some((e) => e.property === 'name')).toBe(true);
    const nameError = errors.find((e) => e.property === 'name');
    expect(nameError?.constraints).toHaveProperty('isNotEmpty');
  });
});
