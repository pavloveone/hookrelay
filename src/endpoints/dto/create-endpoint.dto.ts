import { IsArray, IsString, IsUrl } from 'class-validator';

export class CreateEndpointDto {
  @IsString()
  tenantId: string;
  @IsUrl()
  url: string;
  @IsArray()
  @IsString({ each: true })
  subscribedEventTypes: string[];
}
