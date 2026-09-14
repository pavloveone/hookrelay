import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { Tenant } from '../../tenants/entities/tenant.entity';
import { Delivery } from '../../deliveries/entities/delivery.entity';

@Entity()
@Unique(['tenant', 'idempotencyKey'])
export class Event {
  @PrimaryGeneratedColumn('uuid')
  id: string;
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
  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;
}
