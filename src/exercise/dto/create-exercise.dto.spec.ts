import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { CreateExerciseDto } from './create-exercise.dto';
import { MuscleGroup } from '../exercise-musclegroup';

describe('CreateExerciseDto', () => {
  let dto: CreateExerciseDto;
  beforeEach(() => {
    dto = new CreateExerciseDto();
  });
  it('Therefore, validation should be passed with valid data.', async () => {
    const validData = {
      name: 'Push Up',
      muscleGroup: MuscleGroup.Chest,
      numberOfSets: 3,
      repetitions: 12,
      restTime: 60,
      duration: 300,
      note: 'Keep core tight',
    };
    const object = plainToInstance(CreateExerciseDto, validData);
    const errors = await validate(object);

    expect(errors.length).toBe(0);
  });

  describe('Validation for each variable', () => {
    it('It should report an error if "name" is blank.', async () => {
      const invalidData = { name: '' };
      const object = plainToInstance(CreateExerciseDto, invalidData);
      const errors = await validate(object);
      const nameError = errors.find((e) => e.property === 'name');
      expect(nameError).toBeDefined();
      expect(nameError.constraints).toHaveProperty('isNotEmpty');
    });
    it('Report an error if "muscleGroup" is invalid.', async () => {
      const invalidData = { muscleGroup: 'InvalidGroup' };
      const object = plainToInstance(CreateExerciseDto, invalidData);
      const errors = await validate(object);
      const error = errors.find((e) => e.property === 'muscleGroup');
      expect(error).toBeDefined();
      expect(error.constraints.isEnum).toContain(
        'Please select a valid muscle group',
      );
    });
    it('An error should be reported if "numberOfSets" is less than 1.', async () => {
      const invalidData = { numberOfSets: 0 };
      const object = plainToInstance(CreateExerciseDto, invalidData);
      const errors = await validate(object);
      const error = errors.find((e) => e.property === 'numberOfSets');
      expect(error).toBeDefined();
      expect(error.constraints).toHaveProperty('min');
    });

    it('It should throw an error if "repetitions" is not an integer.', async () => {
      const invalidData = { repetitions: 12.5 };
      const object = plainToInstance(CreateExerciseDto, invalidData);
      const errors = await validate(object);
      const error = errors.find((e) => e.property === 'repetitions');
      expect(error).toBeDefined();
      expect(error.constraints).toHaveProperty('isInt');
    });
    it('Therefore, automatically convert strings to numbers using @Type.', async () => {
      const data = {
        numberOfSets: '5',
        repetitions: 10,
        restTime: 30,
        duration: 100,
        name: 'Test',
        note: 'Note',
        muscleGroup: MuscleGroup.Chest,
      };
      const object = plainToInstance(CreateExerciseDto, data);
      const errors = await validate(object);
      expect(errors.length).toBe(0);
      expect(typeof object.numberOfSets).toBe('number');
      expect(object.numberOfSets).toBe(5);
    });
  });
});
