import { TenantThrottlerGuard } from './tenant-throttler.guard';

describe('TenantThrottlerGuard', () => {
  let guard: TenantThrottlerGuard;

  beforeEach(() => {
    // ThrottlerGuard's own constructor deps aren't used by getTracker,
    // so empty stand-ins are enough for this unit test.
    guard = new TenantThrottlerGuard({} as any, {} as any, {} as any);
  });

  it('tracks by tenant id when the request has an authenticated tenant', async () => {
    const tracker = await (guard as any).getTracker({
      tenant: { id: 'tenant-1' },
      ip: '127.0.0.1',
    });

    expect(tracker).toBe('tenant-1');
  });

  it('falls back to the IP address when there is no tenant on the request', async () => {
    const tracker = await (guard as any).getTracker({
      ip: '127.0.0.1',
    });

    expect(tracker).toBe('127.0.0.1');
  });
});
