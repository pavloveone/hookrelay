import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Event } from './entities/event.entity';
import { QueryFailedError, Repository } from 'typeorm';
import { CreateEventDto } from './dto/create-event.dto';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { queues } from '../common/queue/queues';
import { Endpoint } from '../endpoints/entities/endpoint.entity';
import { DeliveriesService } from '../deliveries/deliveries.service';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';

@Injectable()
export class EventsService {
  constructor(
    @InjectRepository(Event)
    private readonly eventsRepository: Repository<Event>,
    @InjectRepository(Endpoint)
    private readonly endpointsRepository: Repository<Endpoint>,
    private readonly deliveriesService: DeliveriesService,
    @InjectQueue(queues.DELIVERIES) private readonly deliveriesQueue: Queue,
    @InjectPinoLogger(EventsService.name) private readonly logger: PinoLogger,
  ) {}

  async createEvent(
    { idempotencyKey, eventType, payload }: CreateEventDto,
    req: Record<string, any>,
  ) {
    const tenantId = req.tenant.id;
    try {
      const newEvent = await this.eventsRepository.save({
        idempotencyKey,
        payload,
        eventType,
        tenant: { id: tenantId },
      });
      this.logger.info(
        { eventId: newEvent.id, tenantId, eventType },
        'event created',
      );
      const endpoints = await this.endpointsRepository
        .createQueryBuilder('endpoint')
        .where('endpoint.tenantId = :tenantId', { tenantId })
        .andWhere(':eventType = ANY(endpoint.subscribedEventTypes)', {
          eventType: eventType,
        })
        .getMany();
      this.logger.info(
        { eventId: newEvent.id, matchedEndpoints: endpoints.length },
        'fan-out targets resolved',
      );
      await Promise.all(
        endpoints.map(async (endpoint) => {
          const delivery = await this.deliveriesService.create({
            endpointId: endpoint.id,
            eventId: newEvent.id,
          });
          await this.deliveriesQueue.add(
            'deliver',
            {
              deliveryId: delivery.id,
            },
            { attempts: 5, backoff: { type: 'exponential', delay: 1000 } },
          );
        }),
      );
      return newEvent;
    } catch (error) {
      if (
        error instanceof QueryFailedError &&
        error.driverError.code !== '23505'
      ) {
        throw new Error(error.message);
      }
      this.logger.info(
        { tenantId, idempotencyKey },
        'duplicate event, returning existing',
      );
      return await this.eventsRepository.findOne({
        where: { idempotencyKey: idempotencyKey, tenant: { id: tenantId } },
      });
    }
  }
}
