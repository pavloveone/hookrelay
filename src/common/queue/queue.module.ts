import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { QueueOptions } from 'bullmq';

@Module({
  imports: [
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory(configService: ConfigService) {
        const factory: QueueOptions = {
          connection: {
            host: configService.get('REDIS_HOST'),
            port: configService.get<number>('REDIS_PORT'),
          },
        };
        return factory;
      },
    }),
    BullModule.registerQueue({ name: 'deliveries' }),
  ],
  exports: [BullModule],
})
export class QueueModule {}
