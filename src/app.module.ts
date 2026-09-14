import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Tenant } from './tenants/entities/tenant.entity';
import { TenantsModule } from './tenants/tenants.module';
import { EndpointsModule } from './endpoints/endpoints.module';
import { Endpoint } from './endpoints/entities/endpoint.entity';
import { Event } from './events/entities/event.entity';
import { EventsModule } from './events/events.module';
import { DeliveriesModule } from './deliveries/deliveries.module';
import { Delivery } from './deliveries/entities/delivery.entity';
import { DeliveryAttemptsModule } from './deliveryAttempts/deliveryAttempts.module';
import { DeliveryAttempt } from './deliveryAttempts/entities/deliveryAttempt.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: process.env.NODE_ENV
        ? `.env.${process.env.NODE_ENV}`
        : '.env',
    }),
    TenantsModule,
    EndpointsModule,
    EventsModule,
    DeliveriesModule,
    DeliveryAttemptsModule,
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        username: configService.get('DB_USERNAME'),
        password: configService.get('DB_PASSWORD'),
        database: configService.get('POSTGRESS_DB'),
        host: configService.get('DB_HOST'),
        port: configService.get<number>('DB_PORT'),
        entities: [Tenant, Endpoint, Event, Delivery, DeliveryAttempt],
      }),
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
