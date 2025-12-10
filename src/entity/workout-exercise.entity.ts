// workout-exercise.entity.ts
import { Exercise } from 'src/exercise/exercise.entity';
import { Workout } from 'src/workoutplan/workoutplan.entity';
import { Entity, PrimaryColumn, ManyToOne, JoinColumn } from 'typeorm';

@Entity('workout_exercises')
export class WorkoutExercise {
  // Khóa chính kép (Composite Primary Key)
  @PrimaryColumn()
  workoutId!: number;

  @PrimaryColumn()
  exerciseId!: number;

  @ManyToOne(() => Workout, (workout) => workout.workoutExercises, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'workoutId' })
  workout!: Workout;

  // --- Mối quan hệ Many-to-One với Exercise ---
  @ManyToOne(() => Exercise, (exercise) => exercise.workoutExercises, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'exerciseId' })
  exercise!: Exercise;
}
