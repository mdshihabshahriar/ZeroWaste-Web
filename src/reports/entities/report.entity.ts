import {
  Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn,
} from 'typeorm';
import { FoodPost } from '../../food-posts/entities/food-posts.entity.js';
import { User } from '../../users/entities/user.entity.js';

export enum ReportStatus {
  OPEN = 'OPEN',
  RESOLVED = 'RESOLVED',
  DISMISSED = 'DISMISSED',
}

@Entity('reports')
@Index(['status'])
@Index(['postId', 'reporterId'], { unique: true }) 
export class Report {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  postId: number;

  @ManyToOne(() => FoodPost, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'postId' })
  post: FoodPost;

  @Column()
  reporterId: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'reporterId' })
  reporter: User;

  @Column({ type: 'text' })
  reason: string;

  @Column({ type: 'enum', enum: ReportStatus, default: ReportStatus.OPEN })
  status: ReportStatus;

  @Column({ type: 'int', nullable: true })
  handledById: number | null;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'handledById' })
  handledBy: User | null;

  @Column({ type: 'text', nullable: true })
  resolutionNote: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  handledAt: Date | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}