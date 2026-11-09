import {
  Check, Column, CreateDateColumn, DeleteDateColumn, Entity, Index,
  JoinColumn, ManyToOne, PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity.js'; 
 
export enum FoodPostStatus {
  POSTED = 'POSTED',
  ACCEPTED = 'ACCEPTED',
  PICKED_UP = 'PICKED_UP',
  DELIVERED = 'DELIVERED',
  EXPIRED = 'EXPIRED',
  CANCELLED = 'CANCELLED',
  REMOVED = 'REMOVED',            
}
 
@Entity('food_posts')
@Index(['status', 'pickupDeadline'])
@Index(['latitude', 'longitude'])
@Check('"portions" > 0')
export class FoodPost {
  @PrimaryGeneratedColumn()
  id: number;
 
  @Index()
  @Column()
  donorId: number;
 
  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'donorId' })
  donor: User;
 
  @Column({ length: 150 })
  title: string;
 
  @Column({ type: 'text', nullable: true })
  description: string | null;
 
  @Column({ length: 50 })
  foodType: string;
 
  @Column({ type: 'int' })
  portions: number;
 
  @Column({ type: 'varchar', nullable: true })
  photoUrl: string | null;
 
  @Column({ type: 'varchar', nullable: true })
  photoPublicId: string | null; 
 
  @Column()
  address: string;
 
  @Column({ type: 'double precision' })
  latitude: number;
 
  @Column({ type: 'double precision' })
  longitude: number;
 
  @Column({ type: 'timestamptz' })
  pickupDeadline: Date;
 
  @Column({ type: 'enum', enum: FoodPostStatus, default: FoodPostStatus.POSTED })
  status: FoodPostStatus;
 
  
  @Column({ type: 'int', nullable: true })
  acceptedById: number | null;
 
  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'acceptedById' })
  acceptedBy: User | null;
 
  @Column({ type: 'int', nullable: true })
  receiverId: number | null;
 
  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'receiverId' })
  receiver: User | null;

  @Column({ type: 'text', nullable: true })
  removeReason: string | null;    
 
  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
 
  @DeleteDateColumn({ type: 'timestamptz' })
  deletedAt: Date | null;
}