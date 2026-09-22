import { IsArray, IsString, IsUrl } from 'class-validator';

export class CreateEndpointDto {
  @IsUrl()
  url: string;
  @IsArray()
  @IsString({ each: true })
  subscribedEventTypes: string[];
}
