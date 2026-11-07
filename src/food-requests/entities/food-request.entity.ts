import {
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Column,
  Index,
} from 'typeorm';
import { FoodPost } from '../../food-posts/entities/food-posts.entity.js';
import { User } from '../../users/entities/user.entity.js';

export enum FoodRequestStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
  CANCELLED = 'CANCELLED',
}

@Entity('food_requests')
@Index(['postId'])
@Index(['receiverId'])
export class FoodRequest {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  postId: number;

  @ManyToOne(() => FoodPost, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'postId' })
  post: FoodPost;

  @Column()
  receiverId: number;

  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'receiverId' })
  receiver: User;

  @Column({
    type: 'enum',
    enum: FoodRequestStatus,
    default: FoodRequestStatus.PENDING,
  })
  status: FoodRequestStatus;

  @CreateDateColumn({ type: 'timestamptz' })
  requestedAt: Date;
}