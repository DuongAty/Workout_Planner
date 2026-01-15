import { Exercise } from '../exercise/exercise.entity';
import { Workout } from '../workoutplan/workoutplan.entity';
import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  fullname: string;

  @Column({ unique: true })
  username: string;

  @Column({ nullable: true })
  password: string;

  @Column({ unique: true, nullable: true })
  email: string;

  @Column({ nullable: true })
  avatar: string;

  @Column({ type: 'text', nullable: true })
  refreshToken?: string | null;

  @OneToMany((_type) => Workout, (workout) => workout.user, { eager: true })
  workout: Workout[];

  @OneToMany((_type) => Exercise, (exercise) => exercise.user, { eager: true })
  exercise: Exercise[];
}
