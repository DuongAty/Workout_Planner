import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { UpdateExerciseDto } from './update-exercise.dto';
import { MuscleGroup } from '../exercise-musclegroup';

describe('UpdateExerciseDto', () => {
  let dto: UpdateExerciseDto;
  beforeEach(() => {
    dto = new UpdateExerciseDto();
  });
  it('It should be valid if all fields are correctly formatted.', async () => {
    const validData = {
      name: 'Squat',
      muscleGroup: MuscleGroup.Chest,
      numberOfSets: 3,
      repetitions: 12,
      restTime: 60,
      duration: 500,
      note: 'Keep back straight',
    };

    const object = plainToInstance(UpdateExerciseDto, validData);
    const errors = await validate(object);
    expect(errors.length).toBe(0);
  });
  it('An error should be reported if muscleGroup is not in the Enum list.', async () => {
    const invalidData = {
      muscleGroup: 'InvalidGroup',
    };
    const object = plainToInstance(UpdateExerciseDto, invalidData);
    const errors = await validate(object);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].constraints).toHaveProperty('isEnum');
    expect(errors[0].constraints.isEnum).toContain(
      'Please select a valid muscle group',
    );
  });
  it('Therefore, it is necessary to automatically convert the numeric string to a number type.', async () => {
    const dataWithStrings = {
      numberOfSets: '3',
      repetitions: '12',
    };
    const object = plainToInstance(UpdateExerciseDto, dataWithStrings);
    expect(typeof object.numberOfSets).toBe('number');
    expect(object.numberOfSets).toBe(3);
    expect(typeof object.repetitions).toBe('number');
    expect(object.repetitions).toBe(12);
  });
  it('It should be valid even if optional fields are missing.', async () => {
    const minimalData = {
      name: 'Push Up',
    };
    const object = plainToInstance(UpdateExerciseDto, minimalData);
    const errors = await validate(object);
    expect(errors.length).toBe(0);
  });
});
