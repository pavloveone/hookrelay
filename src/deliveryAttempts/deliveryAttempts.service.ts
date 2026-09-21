import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeliveryAttempt } from './entities/deliveryAttempt.entity';
import { Repository } from 'typeorm';
import { CreateDeliveryAttemptsDto } from './dto/create-delivery-attempts.dto';

@Injectable()
export class DeliveryAttemptsService {
  constructor(
    @InjectRepository(DeliveryAttempt)
    private readonly deliveryAttemptsRepository: Repository<DeliveryAttempt>,
  ) {}

  create(dto: CreateDeliveryAttemptsDto) {
    return this.deliveryAttemptsRepository.save({
      ...dto,
      delivery: { id: dto.deliveryId },
    });
  }
}
