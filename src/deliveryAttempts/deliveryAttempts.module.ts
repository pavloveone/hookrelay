import { Module } from '@nestjs/common';
import { DeliveryAttemptsService } from './deliveryAttempts.service';
import { DeliveryAttemptsController } from './deliveryAttempts.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DeliveryAttempt } from './entities/deliveryAttempt.entity';

@Module({
  providers: [DeliveryAttemptsService],
  controllers: [DeliveryAttemptsController],
  imports: [TypeOrmModule.forFeature([DeliveryAttempt])],
})
export class DeliveryAttemptsModule {}
