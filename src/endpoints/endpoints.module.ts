import { Module } from '@nestjs/common';
import { EndpointsController } from './endpoints.controller';
import { EndpointsService } from './endpoints.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Endpoint } from './entities/endpoint.entity';

@Module({
  providers: [EndpointsService],
  controllers: [EndpointsController],
  imports: [TypeOrmModule.forFeature([Endpoint])],
  exports: [EndpointsService],
})
export class EndpointsModule {}
