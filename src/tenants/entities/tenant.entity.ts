import { Column, Entity, OneToMany, type Relation } from 'typeorm';
import { Endpoint } from '../../endpoints/entities/endpoint.entity';
import { Event } from '../../events/entities/event.entity';
import { Basic } from '../../common/database/entities/basic.entity';

@Entity()
export class Tenant extends Basic {
  @Column()
  name: string;
  @Column()
  apiKey: string;
  @OneToMany(() => Endpoint, (endpoint) => endpoint.tenant)
  endpoints: Relation<Endpoint>[];
  @OneToMany(() => Event, (event) => event.tenant)
  events: Relation<Event>[];
}
