import { Exercise } from './exercise.entity';
import { User } from '../user/user.entity';
import { Workout } from '../workoutplan/workoutplan.entity';

describe('Exercise Entity', () => {
  it('should create an Exercise instance with correct properties', () => {
    const exercise = new Exercise();
    const mockUser = new User();
    const mockWorkout = new Workout();
    exercise.id = 'exercise-id';
    exercise.name = 'Push Up';
    exercise.reps = 15;
    exercise.sets = 3;
    exercise.restTime = 60;
    exercise.muscleGroup = 'Chest';
    exercise.note = 'Keep back straight';
    exercise.workoutId = 'workout-id';
    exercise.workoutPlan = mockWorkout;
    exercise.user = mockUser;

    expect(exercise).toBeDefined();
    expect(exercise.name).toBe('Push Up');
    expect(exercise.reps).toBe(15);
    expect(exercise.sets).toBe(3);
    expect(exercise.restTime).toBe(60);
    expect(exercise.muscleGroup).toBe('Chest');
    expect(exercise.note).toBe('Keep back straight');

    expect(exercise.workoutPlan).toBeInstanceOf(Workout);
    expect(exercise.user).toBeInstanceOf(User);
    expect(exercise.workoutId).toBe('workout-id');
  });

  it('should initialize with undefined values if not set', () => {
    const exercise = new Exercise();
    expect(exercise.id).toBeUndefined();
    expect(exercise.name).toBeUndefined();
  });
});
