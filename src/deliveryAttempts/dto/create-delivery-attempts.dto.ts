import { IsNumber, IsString } from 'class-validator';

export class CreateDeliveryAttemptsDto {
  @IsString()
  deliveryId: string;
  @IsNumber()
  httpStatusCode?: number;
  @IsString()
  responseBody?: string;
  @IsString()
  error?: string;
  @IsNumber()
  durationMs: number;
}
