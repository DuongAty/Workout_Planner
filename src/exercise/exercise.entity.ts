import { Exclude } from 'class-transformer';
import { User } from '../user/user.entity';
import { Workout } from '../workoutplan/workoutplan.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  JoinColumn,
  ManyToOne,
  DeleteDateColumn,
  OneToMany,
} from 'typeorm';
import { ExerciseSet } from './exersiceTracking/exerciseSet.entity';
import { StepOfExercise } from './StepOfExercises/step-of-exercise.entity';

@Entity('exercises')
export class Exercise {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ length: 100 })
  name!: string;

  @Column('int')
  repetitions!: number;

  @Column('int')
  numberOfSets!: number;

  @Column('int')
  restTime!: number;

  @Column({ length: 50 })
  muscleGroup!: string;

  @Column({ default: 0 })
  duration: number;

  @Column({ nullable: true })
  note!: string;

  @Column({ nullable: true })
  thumbnail: string;

  @Column({ nullable: true })
  videoUrl: string;

  @DeleteDateColumn()
  deletedAt: Date;

  @ManyToOne(() => Workout, (plan) => plan.exercises, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'workoutId' })
  workoutPlan: Workout;

  @Column()
  workoutId: string;

  @ManyToOne((_type) => User, (user) => user.exercise, { eager: false })
  @Exclude({ toPlainOnly: true })
  user: User;

  @OneToMany(() => ExerciseSet, (exerciseSet) => exerciseSet.exercise, {
    cascade: true,
  })
  sets: ExerciseSet[];

  @OneToMany(() => StepOfExercise, (step) => step.exercise, { cascade: true })
  steps: StepOfExercise[];
}
