import { IsBoolean, IsString } from 'class-validator';

export class RecordAttemptResultDto {
  @IsString()
  endpointId?: string;
  @IsBoolean()
  success: boolean;
}
