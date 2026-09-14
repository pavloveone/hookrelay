import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Delivery } from '../../deliveries/entities/delivery.entity';

@Entity()
export class DeliveryAttempt {
  @PrimaryGeneratedColumn('uuid')
  id: string;
  @ManyToOne(() => Delivery, (delivery) => delivery.deliveryAttempts)
  delivery: Delivery;
  @Column({ default: 0 })
  attemptNumber: number;
  @Column({ nullable: true })
  httpStatusCode: number;
  @Column({ type: 'text', nullable: true })
  responseBody: string;
  @Column()
  durationMs: number;
  @Column({ nullable: true })
  error: string;
  @CreateDateColumn({ type: 'timestamp' })
  attemptedAt: Date;
}
