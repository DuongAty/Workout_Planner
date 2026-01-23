import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Exercise } from '../exercise.entity';

@Entity('step_of_exercises')
export class StepOfExercise {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'int' })
  order: number;

  @Column({ type: 'text' })
  description: string;

  @ManyToOne(() => Exercise, (exercise) => exercise.steps, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'exerciseId' })
  exercise: Exercise;
}
