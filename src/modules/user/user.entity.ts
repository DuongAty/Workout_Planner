import { BodyMeasurement } from '../body-measurement/body-measurement.entity';
import { Workout } from '../workoutplan/workoutplan.entity';
import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { NutritionLog } from '../nutrition/nutrition-log.entity';
import { AuthProvider, Gender, UserGoal } from '../../enums/user-enum';
import { Token } from './fcmToken/token.entity';
import { ResetToken } from './resetToken/reset-token.entity';
import { Exclude } from 'class-transformer';
@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  fullname: string;

  @Column({ unique: true })
  username: string;

  @Column({ nullable: true })
  @Exclude()
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
  @Exclude()
  refreshToken?: string | null;

  @OneToMany((_type) => Workout, (workout) => workout.user, { eager: false })
  workout: Workout[];

  @OneToMany(() => Token, (token) => token.user)
  token: Token[];

  @OneToMany(() => BodyMeasurement, (measurement) => measurement.user)
  measurements: BodyMeasurement[];

  @OneToMany(() => NutritionLog, (nutritionLog) => nutritionLog.user)
  nutritionLogs: NutritionLog[];

  @OneToMany(() => ResetToken, (resetToken) => resetToken.user)
  resetTokens: ResetToken[];
}
