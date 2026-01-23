import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Workout } from '../workoutplan.entity';

@Entity()
export class ScheduleItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'date' })
  date: string;

  @Column({ default: 'planned' })
  status: string;

  @ManyToOne(() => Workout, (workout) => workout.scheduleItems, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'workoutId' })
  workout: Workout;
}
