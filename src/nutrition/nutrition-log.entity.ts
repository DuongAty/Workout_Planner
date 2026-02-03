import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../user/user.entity';
import { Exclude } from 'class-transformer';

@Entity('nutrition_logs')
export class NutritionLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  mealDescription: string;

  @Column('int')
  calories: number;

  @Column('int')
  protein: number;

  @Column('int')
  carbs: number;

  @Column('int')
  fat: number;

  @Column({ type: 'text', nullable: true })
  advice: string;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne((_type) => User, (user) => user.exercise, { eager: false })
  @Exclude({ toPlainOnly: true })
  user: User;

  @Column()
  userId: string;
}
