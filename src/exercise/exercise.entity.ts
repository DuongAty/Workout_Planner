// exercise.entity.ts
import { WorkoutExercise } from 'src/entity/workout-exercise.entity';
import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';

@Entity('exercises')
export class Exercise {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ length: 100 })
  name!: string;

  @Column('int')
  reps!: number;

  @Column('int')
  sets!: number;

  @Column('int')
  restTime!: number;

  @Column({ length: 50 })
  muscleGroup!: string;

  @OneToMany(() => WorkoutExercise, (we) => we.exercise)
  workoutExercises!: WorkoutExercise[];
}
