import { Exclude } from 'class-transformer';
import { Exercise } from '../exercise/exercise.entity';
import { User } from '../user/user.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  ManyToOne,
} from 'typeorm';

@Entity('workouts')
export class Workout {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100 })
  name: string;

  @OneToMany(() => Exercise, (exercise) => exercise.workoutPlan)
  exercises: Exercise[];

  @Column({ default: 0 })
  numExercises: number;

  @ManyToOne((_type) => User, (user) => user.workout, { eager: false })
  @Exclude({ toPlainOnly: true })
  user: User;
}
