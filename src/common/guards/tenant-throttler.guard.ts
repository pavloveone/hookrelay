import { ThrottlerGuard } from '@nestjs/throttler';
import { IRequest } from './api-key.guard';

export class TenantThrottlerGuard extends ThrottlerGuard {
  protected async getTracker(req: IRequest): Promise<string> {
    return req.tenant?.id ?? req.ip;
  }
}
