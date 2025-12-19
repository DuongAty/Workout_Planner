// exercise.entity.ts
import { Workout } from 'src/workoutplan/workoutplan.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  JoinColumn,
  ManyToOne,
} from 'typeorm';

@Entity('exercises')
export class Exercise {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

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

  @Column({ length: 100 })
  note!: string;

  @ManyToOne(() => Workout, (plan) => plan.exercises, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'workoutId' })
  workoutPlan: Workout;

  @Column()
  workoutId: string;
}
