import { Module } from '@nestjs/common';
import { DeliveriesService } from './deliveries.service';
import { DeliveriesController } from './deliveries.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Delivery } from './entities/delivery.entity';
import { DeliveriesProcessor } from './deliveries.processor';
import { HttpModule } from '@nestjs/axios';
import { DeliveryAttemptsModule } from '../deliveryAttempts/deliveryAttempts.module';
import { EndpointsModule } from '../endpoints/endpoints.module';

@Module({
  providers: [DeliveriesService, DeliveriesProcessor],
  controllers: [DeliveriesController],
  imports: [
    TypeOrmModule.forFeature([Delivery]),
    HttpModule,
    DeliveryAttemptsModule,
    EndpointsModule,
  ],
  exports: [DeliveriesService],
})
export class DeliveriesModule {}
