import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeliveryAttempt } from './entities/deliveryAttempt.entity';
import { Repository } from 'typeorm';

@Injectable()
export class DeliveryAttemptsService {
  constructor(
    @InjectRepository(DeliveryAttempt)
    private readonly deliveryAttemptsRepository: Repository<DeliveryAttempt>,
  ) {}
}
