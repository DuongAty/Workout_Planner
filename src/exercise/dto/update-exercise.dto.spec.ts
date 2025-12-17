import { validate } from 'class-validator';
import { UpdateExerciseDto } from './update-exercise.dto';
import { MuscleGroup } from '../exercise-musclegroup';

describe('UpdateExerciseDto', () => {
  const mockUpdateData = {
    name: 'Bench Press Updated',
    muscleGroup: MuscleGroup.Chest,
    sets: 4,
    reps: 12,
    restTime: 60,
    note: 'Go heavy',
  };
  it('should pass validation when all data is valid', async () => {
    const dto = new UpdateExerciseDto();
    Object.assign(dto, mockUpdateData);
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });
  it('should fail validation when muscleGroup is not a valid enum value', async () => {
    const dto = new UpdateExerciseDto();
    Object.assign(dto, mockUpdateData);
    dto.muscleGroup = 'InvalidGroup';
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    const muscleError = errors.find((e) => e.property === 'muscleGroup');
    expect(muscleError).toBeDefined();
    expect(muscleError?.constraints?.isEnum).toBe(
      'Please select a valid muscle group from the list.',
    );
  });
});
