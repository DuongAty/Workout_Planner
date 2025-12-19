// workout.entity.ts
import { Exercise } from 'src/exercise/exercise.entity';
import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';

@Entity('workouts')
export class Workout {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100 })
  name: string;

  @OneToMany(() => Exercise, (exercise) => exercise.workoutPlan)
  exercises: Exercise[];
}
