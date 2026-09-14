import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Tenant } from '../../tenants/entities/tenant.entity';
import { Delivery } from '../../deliveries/entities/delivery.entity';

export enum EStatus {
  ACTIVE = 'active',
  DISABLE = 'disabled',
}

export enum ECircuitState {
  CLOSED = 'closed',
  OPEN = 'open',
  HALF_OPEN = 'half_open',
}

@Entity()
export class Endpoint {
  @PrimaryGeneratedColumn('uuid')
  id: string;
  @ManyToOne(() => Tenant, (tenant) => tenant.endpoints)
  tenant: Tenant;
  @OneToMany(() => Delivery, (delivery) => delivery.endpoint)
  deliveries: Delivery[];
  @Column()
  url: string;
  @Column({ select: false })
  secret: string;
  @Column('text', { array: true })
  subscribedEventTypes: string[];
  @Column({ type: 'enum', enum: EStatus, default: EStatus.ACTIVE })
  status: EStatus;
  @Column({ type: 'enum', enum: ECircuitState, default: ECircuitState.CLOSED })
  circuitState: ECircuitState;
  @Column({ default: 0 })
  consecutiveFailures: number;
  @Column({ type: 'timestamp', nullable: true })
  circuitOpenedAt: Date;
  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;
}
