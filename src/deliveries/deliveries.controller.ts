import { Controller, Get, Param, Req, UseGuards } from '@nestjs/common';
import { DeliveriesService } from './deliveries.service';
import * as apiKeyGuard from '../common/guards/api-key.guard';

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
}
