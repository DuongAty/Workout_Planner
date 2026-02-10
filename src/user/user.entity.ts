import { BodyMeasurement } from '../body-measurement/body-measurement.entity';
import { Exercise } from '../exercise/exercise.entity';
import { Workout } from '../workoutplan/workoutplan.entity';
import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { NutritionLog } from '../nutrition/nutrition-log.entity';
import { AuthProvider, Gender, UserGoal } from '../common/enum/user-enum';
@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  fullname: string;

  @Column({ unique: true })
  username: string;

  @Column({ nullable: true})
  password: string;

  @Column({ unique: true, nullable: true })
  email: string;

  @Column({ nullable: true })
  avatar: string;

  @Column({ nullable: true })
  age: number;

  @Column({ nullable: true })
  weight: number;

  @Column({ nullable: true })
  height: number;

  @Column({ type: 'enum', enum: UserGoal, default: UserGoal.MAINTAIN })
  goal: UserGoal;

  @Column({ nullable: true, type: 'enum', enum: Gender })
  gender: Gender;

  @Column({
    type: 'enum',
    enum: AuthProvider,
    default: AuthProvider.LOCAL,
  })
  provider?: AuthProvider;

  @Column({ nullable: true })
  providerId?: string;

  @Column({ type: 'text', nullable: true })
  refreshToken?: string | null;

  @OneToMany((_type) => Workout, (workout) => workout.user, { eager: true })
  workout: Workout[];

  @OneToMany((_type) => Exercise, (exercise) => exercise.user, { eager: true })
  exercise: Exercise[];

  @OneToMany(() => BodyMeasurement, (measurement) => measurement.user)
  measurements: BodyMeasurement[];

  @OneToMany(() => NutritionLog, (nutritionLog) => nutritionLog.user)
  nutritionLogs: NutritionLog[];
}
