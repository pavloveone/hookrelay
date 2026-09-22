import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { EndpointsService } from './endpoints.service';
import { CreateEndpointDto } from './dto/create-endpoint.dto';
import { ApiKeyGuard } from '../common/guards/api-key.guard';

@Controller('endpoints')
export class EndpointsController {
  constructor(private readonly endpointsService: EndpointsService) {}

  @UseGuards(ApiKeyGuard)
  @Post()
  create(@Body() dto: CreateEndpointDto, @Req() req: any) {
    return this.endpointsService.create(dto, req);
  }
}
