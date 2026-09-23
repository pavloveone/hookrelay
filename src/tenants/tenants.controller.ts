import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { TenantsService } from './tenants.service';
import { CreateTenantDto } from './dto/create-tenant.dto';
import * as apiKeyGuard from '../common/guards/api-key.guard';

@Controller('tenants')
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  @Post()
  create(@Body() dto: CreateTenantDto) {
    return this.tenantsService.create(dto);
  }

  @UseGuards(apiKeyGuard.ApiKeyGuard)
  @Get('/me')
  getCurrentTenant(@Req() req: apiKeyGuard.IRequest) {
    return this.tenantsService.findByApiKey(req.headers['x-api-key']);
  }
}
