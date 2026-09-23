import { Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { DeliveriesService } from './deliveries.service';
import * as apiKeyGuard from '../common/guards/api-key.guard';
import { TenantThrottlerGuard } from '../common/guards/tenant-throttler.guard';

@Controller('deliveries')
export class DeliveriesController {
  constructor(private readonly deliveriesService: DeliveriesService) {}

  @UseGuards(apiKeyGuard.ApiKeyGuard)
  @Get()
  getDeliveriesByTenant(@Req() req: apiKeyGuard.IRequest) {
    return this.deliveriesService.getDeliveriesByTenant(req);
  }

  @UseGuards(apiKeyGuard.ApiKeyGuard)
  @Get(':id')
  getDeliveryByTenant(
    @Param('id') id: string,
    @Req() req: apiKeyGuard.IRequest,
  ) {
    return this.deliveriesService.getDeliveryByTenant(id, req);
  }

  @UseGuards(apiKeyGuard.ApiKeyGuard, TenantThrottlerGuard)
  @Post(':id/replay')
  replay(@Param('id') id: string, @Req() req: apiKeyGuard.IRequest) {
    return this.deliveriesService.replay(id, req);
  }
}
