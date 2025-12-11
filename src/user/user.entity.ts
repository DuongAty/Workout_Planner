import { Exercise } from 'src/exercise/exercise.entity';
import { Workout } from 'src/workoutplan/workoutplan.entity';
import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  username: string;

  @Column()
  password: string;

  @OneToMany((_type) => Workout, (workout) => workout.user, { eager: true })
  workout: Workout[];

  @OneToMany((_type) => Exercise, (exercise) => exercise.user, { eager: true })
  exercise: Exercise[];
}
