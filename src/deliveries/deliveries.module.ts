import { Module } from '@nestjs/common';
import { DeliveriesService } from './deliveries.service';
import { DeliveriesController } from './deliveries.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Delivery } from './entities/delivery.entity';

@Module({
  providers: [DeliveriesService],
  controllers: [DeliveriesController],
  imports: [TypeOrmModule.forFeature([Delivery])],
  exports: [DeliveriesService],
})
export class DeliveriesModule {}
