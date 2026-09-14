import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Endpoint } from '../../endpoints/entities/endpoint.entity';

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
  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;
}
