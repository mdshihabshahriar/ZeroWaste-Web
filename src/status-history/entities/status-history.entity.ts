import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { FoodPost, FoodPostStatus } from '../../food-posts/entities/food-posts.entity.js';
import { User } from '../../users/entities/user.entity.js';
 
@Entity('status_history')
export class StatusHistory {
  @PrimaryGeneratedColumn()
  id: number;
 
  @Index()
  @Column()
  postId: number;
 
  @ManyToOne(() => FoodPost, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'postId' })
  post: FoodPost;
 
  @Column({ type: 'enum', enum: FoodPostStatus, nullable: true })
  fromStatus: FoodPostStatus | null;
 
  @Column({ type: 'enum', enum: FoodPostStatus })
  toStatus: FoodPostStatus;
 
  @Column({ type: 'int', nullable: true }) // scheduler (system) hole null
  changedById: number | null;
 
  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'changedById' })
  changedBy: User | null;
 
  @CreateDateColumn({ type: 'timestamptz' })
  changedAt: Date;
}