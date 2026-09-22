import { ThrottlerGuard } from '@nestjs/throttler';

export class TenantThrottlerGuard extends ThrottlerGuard {
  protected async getTracker(req: Record<string, any>): Promise<string> {
    return req.tenant?.id ?? req.ip;
  }
}
