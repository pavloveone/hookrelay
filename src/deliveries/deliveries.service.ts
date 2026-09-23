import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Delivery, EStatus } from './entities/delivery.entity';
import { Repository } from 'typeorm';
import { CreateDeliveryDto } from './dto/create-delivery.dto';
import * as apiKeyGuard from '../common/guards/api-key.guard';

@Injectable()
export class DeliveriesService {
  constructor(
    @InjectRepository(Delivery)
    private readonly deliveriesRepository: Repository<Delivery>,
  ) {}

  getDeliveriesByTenant(req: apiKeyGuard.IRequest) {
    return this.deliveriesRepository
      .createQueryBuilder('delivery')
      .leftJoinAndSelect('delivery.endpoint', 'endpoint')
      .where('endpoint.tenant.id = :tenantId', { tenantId: req.tenant.id })
      .getMany();
  }

  async getDeliveryByTenant(id: string, req: apiKeyGuard.IRequest) {
    const currentDelivery = await this.deliveriesRepository
      .createQueryBuilder('delivery')
      .leftJoinAndSelect('delivery.endpoint', 'endpoint')
      .leftJoinAndSelect('delivery.event', 'event')
      .leftJoinAndSelect('delivery.deliveryAttempts', 'deliveryAttempts')
      .where('delivery.id = :id', { id })
      .andWhere('endpoint.tenant.id = :tenantId', { tenantId: req.tenant.id })
      .getOne();

    if (!currentDelivery) {
      throw new NotFoundException();
    }
    return currentDelivery;
  }

  create(dto: CreateDeliveryDto) {
    return this.deliveriesRepository.save({
      event: { id: dto.eventId },
      endpoint: { id: dto.endpointId },
    });
  }

  findOne(id: string) {
    return this.deliveriesRepository
      .createQueryBuilder('delivery')
      .leftJoinAndSelect('delivery.event', 'event')
      .leftJoinAndSelect('delivery.endpoint', 'endpoint')
      .addSelect('endpoint.secret')
      .where('delivery.id = :id', { id })
      .getOne();
  }

  async updateStatus(id: string, newStatus: EStatus) {
    const currentDelivery = await this.deliveriesRepository.findOneBy({ id });
    return this.deliveriesRepository.save({
      ...currentDelivery,
      status: newStatus,
    });
  }
}
