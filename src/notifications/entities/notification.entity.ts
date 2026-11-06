import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

import { User } from '../../users/entities/user.entity.js';
 
@Entity('notifications')

export class Notification {

  @PrimaryGeneratedColumn()

  id: number;
 
  @Index()

  @Column()

  userId: number;
 
  @ManyToOne(() => User, { onDelete: 'CASCADE' })

  @JoinColumn({ name: 'userId' })

  user: User;
 
  @Column({ type: 'text' })

  message: string;
 
  @Column({ default: false })

  isRead: boolean;
 
  @CreateDateColumn({ type: 'timestamptz' })

  createdAt: Date;

}
 