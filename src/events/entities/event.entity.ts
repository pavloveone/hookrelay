import { Column, Entity, ManyToOne, OneToMany, Unique } from 'typeorm';
import { Tenant } from '../../tenants/entities/tenant.entity';
import { Delivery } from '../../deliveries/entities/delivery.entity';
import { Basic } from '../../common/database/entities/basic.entity';

@Entity()
@Unique(['tenant', 'idempotencyKey'])
export class Event extends Basic {
  @ManyToOne(() => Tenant, (tenant) => tenant.events)
  tenant: Tenant;
  @OneToMany(() => Delivery, (delivery) => delivery.event)
  deliveries: Delivery[];
  @Column()
  eventType: string;
  @Column({ type: 'jsonb' })
  payload: Record<string, any>;
  @Column()
  idempotencyKey: string;
}
