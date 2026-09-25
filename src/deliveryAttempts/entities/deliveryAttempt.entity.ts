import { Column, Entity, ManyToOne, type Relation } from 'typeorm';
import { Delivery } from '../../deliveries/entities/delivery.entity';
import { Basic } from '../../common/database/entities/basic.entity';

@Entity()
export class DeliveryAttempt extends Basic {
  @ManyToOne(() => Delivery, (delivery) => delivery.deliveryAttempts)
  delivery: Relation<Delivery>;
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
}
