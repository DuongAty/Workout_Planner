import { Exercise } from '../exercise/exercise.entity';
import { Workout } from './workoutplan.entity';
import { User } from '../user/user.entity';

describe('Workout Entity', () => {
  const workout = new Workout();
  const mockUser = { id: 'userId', username: 'duong' } as User;
  it('should create a workout instance with correct properties', () => {
    const mockExercise = { id: 'ex-uuid', name: 'Push Up' } as Exercise;
    workout.id = 'workout-uuid';
    workout.name = 'Morning Routine';
    workout.user = mockUser;
    workout.exercises = [mockExercise];
    expect(workout).toBeDefined();
    expect(workout.id).toBe('workout-uuid');
    expect(workout.name).toBe('Morning Routine');
    expect(workout.user).toEqual(mockUser);
    expect(Array.isArray(workout.exercises)).toBe(true);
    expect(workout.exercises).toContain(mockExercise);
  });
  it('should handle the relationship with Exercises correctly', () => {
    workout.exercises = [];
    const exercise1 = new Exercise();
    exercise1.id = 'ex-1';
    const exercise2 = new Exercise();
    exercise2.id = 'ex-2';
    workout.exercises.push(exercise1, exercise2);
    expect(workout.exercises.length).toBe(2);
  });
});
