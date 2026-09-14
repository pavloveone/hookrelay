import { Controller } from '@nestjs/common';
import { DeliveryAttemptsService } from './deliveryAttempts.service';

@Controller('delivery-attempts')
export class DeliveryAttemptsController {
  constructor(
    private readonly deliveryAttemptsService: DeliveryAttemptsService,
  ) {}
}
