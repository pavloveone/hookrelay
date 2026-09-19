import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Tenant } from '../../tenants/entities/tenant.entity';
import { Endpoint } from '../../endpoints/entities/endpoint.entity';
import { Event } from '../../events/entities/event.entity';
import { Delivery } from '../../deliveries/entities/delivery.entity';
import { DeliveryAttempt } from '../../deliveryAttempts/entities/deliveryAttempt.entity';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        username: configService.get('POSTGRES_USER'),
        password: configService.get('POSTGRES_PASSWORD'),
        database: configService.get('POSTGRES_DB'),
        host: configService.get('DB_HOST'),
        port: configService.get<number>('DB_PORT'),
        entities: [Tenant, Endpoint, Event, Delivery, DeliveryAttempt],
      }),
    }),
  ],
})
export class DatabaseModule {}
