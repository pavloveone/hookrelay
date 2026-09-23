import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { TenantsService } from '../../tenants/tenants.service';
import { Tenant } from '../../tenants/entities/tenant.entity';

export interface IRequest {
  headers: Record<string, any>;
  tenant: Tenant;
  [key: string]: any;
}

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private readonly tenantsService: TenantsService) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<IRequest>();
    const tenant = await this.tenantsService.findByApiKey(
      request.headers['x-api-key'],
    );
    request.tenant = tenant;
    return true;
  }
}
