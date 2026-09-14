import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Endpoint } from '../../endpoints/entities/endpoint.entity';
import { Event } from '../../events/entities/event.entity';

@Entity()
export class Tenant {
  @PrimaryGeneratedColumn('uuid')
  id: string;
  @Column()
  name: string;
  @Column()
  apiKey: string;
  @OneToMany(() => Endpoint, (endpoint) => endpoint.tenant)
  endpoints: Endpoint[];
  @OneToMany(() => Event, (event) => event.tenant)
  events: Event[];
  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;
}
