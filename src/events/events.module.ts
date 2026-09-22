import { Module } from '@nestjs/common';
import { EventsService } from './events.service';
import { EventsController } from './events.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Event } from './entities/event.entity';
import { QueueModule } from '../common/queue/queue.module';
import { DeliveriesModule } from '../deliveries/deliveries.module';
import { Endpoint } from '../endpoints/entities/endpoint.entity';
import { TenantsModule } from '../tenants/tenants.module';

@Module({
  providers: [EventsService],
  controllers: [EventsController],
  imports: [
    TypeOrmModule.forFeature([Event, Endpoint]),
    QueueModule,
    DeliveriesModule,
    TenantsModule,
  ],
})
export class EventsModule {}
