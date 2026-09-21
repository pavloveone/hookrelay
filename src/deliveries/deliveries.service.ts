import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Delivery, EStatus } from './entities/delivery.entity';
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

  findOne(id: string) {
    return this.deliveriesRepository.findOne({
      where: { id },
      relations: { event: true, endpoint: true },
    });
  }

  async updateStatus(id: string, newStatus: EStatus) {
    const currentDelivery = await this.deliveriesRepository.findOneBy({ id });
    return this.deliveriesRepository.save({
      ...currentDelivery,
      status: newStatus,
    });
  }
}
