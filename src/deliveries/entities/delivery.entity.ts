import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Event } from '../../events/entities/event.entity';
import { Endpoint } from '../../endpoints/entities/endpoint.entity';
import { DeliveryAttempt } from '../../deliveryAttempts/entities/deliveryAttempt.entity';

export enum EStatus {
  PENDING = 'pending',
  SUCCEEDED = 'succeeded',
  FAILED = 'failed',
  EXHAUSTED = 'exhausted',
}

@Entity()
export class Delivery {
  @PrimaryGeneratedColumn('uuid')
  id: string;
  @ManyToOne(() => Event, (event) => event.deliveries)
  event: Event;
  @ManyToOne(() => Endpoint, (endpoint) => endpoint.deliveries)
  endpoint: Endpoint;
  @OneToMany(
    () => DeliveryAttempt,
    (deliveryAttempt) => deliveryAttempt.delivery,
  )
  deliveryAttempts: DeliveryAttempt[];
  @Column({ type: 'enum', enum: EStatus, default: EStatus.PENDING })
  status: EStatus;
  @Column({ default: 0 })
  attemptCount: number;
  @Column({ type: 'timestamp', nullable: true })
  nextRetryAt: Date;
  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;
}
