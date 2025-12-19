import { Exclude } from 'class-transformer';
import { Exercise } from 'src/exercise/exercise.entity';
import { User } from 'src/user/user.entity';
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

  @ManyToOne((_type) => User, (user) => user.workout, { eager: false })
  @Exclude({ toPlainOnly: true })
  user: User;
}
