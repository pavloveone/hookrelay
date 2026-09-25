import {
  Column,
  Entity,
  ManyToOne,
  OneToMany,
  type Relation,
} from 'typeorm';
import { Event } from '../../events/entities/event.entity';
import { Endpoint } from '../../endpoints/entities/endpoint.entity';
import { DeliveryAttempt } from '../../deliveryAttempts/entities/deliveryAttempt.entity';
import { Basic } from '../../common/database/entities/basic.entity';

export enum EStatus {
  PENDING = 'pending',
  SUCCEEDED = 'succeeded',
  FAILED = 'failed',
  EXHAUSTED = 'exhausted',
}

@Entity()
export class Delivery extends Basic {
  @ManyToOne(() => Event, (event) => event.deliveries)
  event: Relation<Event>;
  @ManyToOne(() => Endpoint, (endpoint) => endpoint.deliveries)
  endpoint: Relation<Endpoint>;
  @OneToMany(
    () => DeliveryAttempt,
    (deliveryAttempt) => deliveryAttempt.delivery,
  )
  deliveryAttempts: Relation<DeliveryAttempt>[];
  @Column({ type: 'enum', enum: EStatus, default: EStatus.PENDING })
  status: EStatus;
  @Column({ default: 0 })
  attemptCount: number;
  @Column({ type: 'timestamp', nullable: true })
  nextRetryAt: Date;
}
