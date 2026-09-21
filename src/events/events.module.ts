import { Module } from '@nestjs/common';
import { EventsService } from './events.service';
import { EventsController } from './events.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Event } from './entities/event.entity';
import { QueueModule } from '../common/queue/queue.module';

@Module({
  providers: [EventsService],
  controllers: [EventsController],
  imports: [TypeOrmModule.forFeature([Event]), QueueModule],
})
export class EventsModule {}
