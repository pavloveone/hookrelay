import { Module } from '@nestjs/common';
import { EventsService } from './events.service';
import { EventsController } from './events.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Event } from './entities/event.entity';

@Module({
  providers: [EventsService],
  controllers: [EventsController],
  imports: [TypeOrmModule.forFeature([Event])],
})
export class EventsModule {}
