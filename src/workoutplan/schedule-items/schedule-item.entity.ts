import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Workout } from '../workoutplan.entity';
import { WorkoutStatus } from '../workout-status';

@Entity()
export class ScheduleItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'date' })
  date: string;

  @Column({ type: 'enum', enum: WorkoutStatus, default: 'planned' })
  status: WorkoutStatus;

  @ManyToOne(() => Workout, (workout) => workout.scheduleItems, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'workoutId' })
  workout: Workout;
}
