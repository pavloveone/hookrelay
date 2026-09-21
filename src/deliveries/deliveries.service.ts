import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Delivery } from './entities/delivery.entity';
import { Repository } from 'typeorm';
import { CreateDeliveryDto } from './dto/create-delivery.dto';

@Injectable()
export class DeliveriesService {
  constructor(
    @InjectRepository(Delivery)
    private readonly deliveriesRepository: Repository<Delivery>,
  ) {}

  create(dto: CreateDeliveryDto) {
    return this.deliveriesRepository.save({
      event: { id: dto.eventId },
      endpoint: { id: dto.endpointId },
    });
  }
}
