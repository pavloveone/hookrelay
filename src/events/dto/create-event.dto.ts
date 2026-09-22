import { IsObject, IsString } from 'class-validator';

export class CreateEventDto {
  @IsString()
  eventType: string;
  @IsObject()
  payload: Record<string, any>;
  @IsString()
  idempotencyKey: string;
}
