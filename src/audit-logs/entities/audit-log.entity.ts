import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity.js';

@Entity('audit_logs')
export class AuditLog {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'user_id' })
  user?: User;

  @Column({ length: 100 })
  action: string;                  

  @Column({ length: 50, nullable: true })
  entity?: string;

  @Column({ type: 'int', nullable: true })
  entityId?: number;

  @CreateDateColumn()
  createdAt: Date;
}