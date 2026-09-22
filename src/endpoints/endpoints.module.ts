import { Module } from '@nestjs/common';
import { EndpointsController } from './endpoints.controller';
import { EndpointsService } from './endpoints.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Endpoint } from './entities/endpoint.entity';
import { TenantsModule } from '../tenants/tenants.module';

@Module({
  providers: [EndpointsService],
  controllers: [EndpointsController],
  imports: [TypeOrmModule.forFeature([Endpoint]), TenantsModule],
  exports: [EndpointsService],
})
export class EndpointsModule {}
