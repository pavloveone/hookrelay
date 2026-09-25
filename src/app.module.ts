import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { TenantsModule } from './tenants/tenants.module';
import { EndpointsModule } from './endpoints/endpoints.module';
import { EventsModule } from './events/events.module';
import { DeliveriesModule } from './deliveries/deliveries.module';
import { DeliveryAttemptsModule } from './deliveryAttempts/deliveryAttempts.module';
import { DatabaseModule } from './common/database/database.module';
import { QueueModule } from './common/queue/queue.module';
import { ThrottlerModule } from '@nestjs/throttler';
import { LoggerModule } from './common/logger/logger.module';

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
    DatabaseModule,
    QueueModule,
    LoggerModule,
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
