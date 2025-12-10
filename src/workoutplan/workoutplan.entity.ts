// workout.entity.ts
import { WorkoutExercise } from 'src/entity/workout-exercise.entity';
import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';

@Entity('workouts')
export class Workout {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100 })
  name: string;

  @OneToMany(() => WorkoutExercise, (we) => we.workout)
  workoutExercises!: WorkoutExercise[];
}
