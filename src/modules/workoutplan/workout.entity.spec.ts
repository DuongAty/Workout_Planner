import { instanceToPlain } from 'class-transformer';
import { Workout } from './workoutplan.entity';
import { User } from '../user/user.entity';
import { Exercise } from '../exercise/exercise.entity';
import { ScheduleItem } from './schedule-items/schedule-item.entity';

describe('Workout Entity (pure unit test)', () => {
  it('should create a Workout instance', () => {
    const workout = new Workout();

    expect(workout).toBeInstanceOf(Workout);
  });

  it('should allow setting basic properties', () => {
    const workout = new Workout();

    workout.id = 'workout-id';
    workout.name = 'Morning Workout';
    workout.numExercises = 3;
    workout.estimatedCalories = 250;
    workout.startDate = '2026-02-01';
    workout.endDate = '2026-02-28';
    workout.daysOfWeek = [1, 3, 5];

    expect(workout.id).toBe('workout-id');
    expect(workout.name).toBe('Morning Workout');
    expect(workout.numExercises).toBe(3);
    expect(workout.estimatedCalories).toBe(250);
    expect(workout.startDate).toBe('2026-02-01');
    expect(workout.endDate).toBe('2026-02-28');
    expect(workout.daysOfWeek).toEqual([1, 3, 5]);
  });

  it('should have undefined optional fields by default', () => {
    const workout = new Workout();

    expect(workout.startDate).toBeUndefined();
    expect(workout.endDate).toBeUndefined();
    expect(workout.daysOfWeek).toBeUndefined();
    expect(workout.deletedAt).toBeUndefined();
  });

  it('should allow assigning exercises relation', () => {
    const workout = new Workout();

    const ex1 = new Exercise();
    const ex2 = new Exercise();

    workout.exercises = [ex1, ex2];

    expect(Array.isArray(workout.exercises)).toBe(true);
    expect(workout.exercises).toHaveLength(2);
    expect(workout.exercises[0]).toBeInstanceOf(Exercise);
  });

  it('should allow assigning schedule items relation', () => {
    const workout = new Workout();

    const item = new ScheduleItem();
    workout.scheduleItems = [item];

    expect(workout.scheduleItems).toHaveLength(1);
    expect(workout.scheduleItems[0]).toBeInstanceOf(ScheduleItem);
  });

  it('should exclude user when transformed to plain object', () => {
    const workout = new Workout();

    workout.name = 'Private Workout';
    workout.user = new User();
    workout.user.id = 'user-id';

    const plain = instanceToPlain(workout);

    expect(plain.name).toBe('Private Workout');
    expect(plain.user).toBeUndefined(); // 👈 @Exclude hoạt động
  });

  it('should allow soft delete field to be set manually', () => {
    const workout = new Workout();
    const deletedDate = new Date();

    workout.deletedAt = deletedDate;

    expect(workout.deletedAt).toBeInstanceOf(Date);
    expect(workout.deletedAt).toBe(deletedDate);
  });
});
