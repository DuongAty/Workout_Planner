import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
} from 'typeorm';
import { Exercise } from '../exercise.entity';
import { Max, Min } from 'class-validator';

@Entity('exercise_sets')
export class ExerciseSet {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('float')
  weight: number;

  @Column('int')
  reps: number;

  @Column('float', { nullable: true })
  rpe: number;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => Exercise, (exercise) => exercise.sets, {
    onDelete: 'CASCADE',
  })
  exercise: Exercise;

  @Column()
  exerciseId: string;
}
