import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Event } from './entities/event.entity';
import { QueryFailedError, Repository } from 'typeorm';
import { CreateEventDto } from './dto/create-event.dto';

@Injectable()
export class EventsService {
  constructor(
    @InjectRepository(Event)
    private readonly eventsRepository: Repository<Event>,
  ) {}

  async createEvent({ tenantId, idempotencyKey, ...rest }: CreateEventDto) {
    try {
      return await this.eventsRepository.save({
        idempotencyKey,
        ...rest,
        tenant: { id: tenantId },
      });
    } catch (error) {
      if (
        error instanceof QueryFailedError &&
        error.driverError.code !== '23505'
      ) {
        throw new Error(error.message);
      }
      return await this.eventsRepository.findOne({
        where: { idempotencyKey: idempotencyKey, tenant: { id: tenantId } },
      });
    }
  }
}
