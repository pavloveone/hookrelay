import { Body, Controller, Post } from '@nestjs/common';
import { EndpointsService } from './endpoints.service';
import { CreateEndpointDto } from './dto/create-endpoint.dto';

@Controller('endpoints')
export class EndpointsController {
  constructor(private readonly endpointsService: EndpointsService) {}

  @Post()
  create(@Body() dto: CreateEndpointDto) {
    return this.endpointsService.create(dto);
  }
}
