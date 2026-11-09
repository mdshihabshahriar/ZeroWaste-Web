import { Check, Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Unique } from 'typeorm';

import { FoodPost } from '../../food-posts/entities/food-posts.entity.js';

import { User } from '../../users/entities/user.entity.js';
 
@Entity('ratings')

@Unique(['postId', 'raterId'])

@Check('"score" BETWEEN 1 AND 5')

export class Rating {

  @PrimaryGeneratedColumn()

  id: number;
 
  @Column()

  postId: number;
 
  @ManyToOne(() => FoodPost, { onDelete: 'CASCADE' })

  @JoinColumn({ name: 'postId' })

  post: FoodPost;
 
  @Column()

  raterId: number;
 
  @ManyToOne(() => User)

  @JoinColumn({ name: 'raterId' })

  rater: User;
 
  @Column()

  ratedId: number;
 
  @ManyToOne(() => User)

  @JoinColumn({ name: 'ratedId' })

  rated: User;
 
  @Column({ type: 'int' })

  score: number;
 
  @Column({ type: 'text', nullable: true })

  comment: string | null;
 
  @CreateDateColumn({ type: 'timestamptz' })

  createdAt: Date;

}
 