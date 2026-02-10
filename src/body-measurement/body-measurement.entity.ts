import { Max, Min } from 'class-validator';
import { MuscleGroup } from '../exercise/exercise-musclegroup';
import { User } from '../user/user.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
} from 'typeorm';
@Entity('body_measurements')
export class BodyMeasurement {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: MuscleGroup,
  })
  key: MuscleGroup;

  @Column({ type: 'float' })
  @Min(10)
  @Max(200)
  value: number;

  @Column({ default: 'cm' })
  unit: string;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => User, (user) => user.measurements)
  user: User;
}
