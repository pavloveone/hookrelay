import { IsString } from '@nestjs/class-validator';
import { IsObject } from 'class-validator';

export class CreateEventDto {
  @IsString()
  tenantId: string;
  @IsString()
  eventType: string;
  @IsObject()
  payload: Record<string, any>;
  @IsString()
  idempotencyKey: string;
}
