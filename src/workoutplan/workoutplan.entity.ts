import { Exclude } from 'class-transformer';
import { Exercise } from '../exercise/exercise.entity';
import { User } from '../user/user.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  ManyToOne,
  DeleteDateColumn,
} from 'typeorm';
import { WorkoutStatus } from './workout-status';
export interface IScheduleItem {
  date: string;
  status: WorkoutStatus.Planned | WorkoutStatus.Completed | WorkoutStatus.Missed;
  completedAt?: Date;
}
@Entity('workouts')
export class Workout {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100 })
  name: string;

  @Column({ default: 0 })
  numExercises: number;

  @Column({ type: 'date', nullable: true })
  startDate: string;

  @Column({ type: 'date', nullable: true })
  endDate: string;

  @Column({
    type: 'enum',
    enum: WorkoutStatus,
    default: 'planned',
  })
  status: WorkoutStatus;

  @Column({ type: 'simple-array', nullable: true })
  daysOfWeek: number[];

  @DeleteDateColumn()
  deletedAt: Date;

  @OneToMany(() => Exercise, (exercise) => exercise.workoutPlan, {
    cascade: true,
  })
  exercises: Exercise[];

  @ManyToOne((_type) => User, (user) => user.workout, { eager: false })
  @Exclude({ toPlainOnly: true })
  user: User;
}
