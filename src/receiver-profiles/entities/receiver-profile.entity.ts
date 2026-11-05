import { Check, Column, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity.js';

@Entity('receiver_profiles')
@Check('"capacity" > 0')
export class ReceiverProfile {
  @PrimaryGeneratedColumn()
  id: number;

  @OneToOne(() => User, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ length: 150 })
  organisationName: string;

  @Column({ length: 50, nullable: true })
  orgType?: string;

  @Column({ type: 'int', nullable: true })
  capacity?: number;
}