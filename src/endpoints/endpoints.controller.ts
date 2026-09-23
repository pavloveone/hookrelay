import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { EndpointsService } from './endpoints.service';
import { CreateEndpointDto } from './dto/create-endpoint.dto';
import * as apiKeyGuard from '../common/guards/api-key.guard';
import { TenantThrottlerGuard } from '../common/guards/tenant-throttler.guard';

@Controller('endpoints')
export class EndpointsController {
  constructor(private readonly endpointsService: EndpointsService) {}

  @UseGuards(apiKeyGuard.ApiKeyGuard, TenantThrottlerGuard)
  @Post()
  create(@Body() dto: CreateEndpointDto, @Req() req: apiKeyGuard.IRequest) {
    return this.endpointsService.create(dto, req);
  }

  @UseGuards(apiKeyGuard.ApiKeyGuard)
  @Get()
  getEndpointsByTenant(@Req() req: apiKeyGuard.IRequest) {
    return this.endpointsService.getEndpointsByTenant(req);
  }

  @UseGuards(apiKeyGuard.ApiKeyGuard)
  @Get(':id')
  getEndpointByTenant(
    @Param('id') id: string,
    @Req() req: apiKeyGuard.IRequest,
  ) {
    return this.endpointsService.getEndpointByTenant(id, req);
  }
}
