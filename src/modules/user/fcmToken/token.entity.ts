import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { User } from '../user.entity';
@Entity()
export class Token {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  fcmToken: string;

  @Column({ default: 'web' })
  device: string;

  @ManyToOne(() => User, (user) => user.token)
  user: User;

  @Column()
  userId: string;
}
