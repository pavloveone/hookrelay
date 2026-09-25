import { ExecutionContext } from '@nestjs/common';
import { ApiKeyGuard } from './api-key.guard';

describe('ApiKeyGuard', () => {
  let guard: ApiKeyGuard;
  let mockTenantsService: { findByApiKey: jest.Mock };

  const makeContext = (request: Record<string, any>): ExecutionContext =>
    ({
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    }) as unknown as ExecutionContext;

  beforeEach(() => {
    mockTenantsService = {
      findByApiKey: jest.fn(),
    };
    guard = new ApiKeyGuard(mockTenantsService as any);
  });

  it('resolves the tenant from the x-api-key header and attaches it to the request', async () => {
    const tenant = { id: 'tenant-1' };
    mockTenantsService.findByApiKey.mockResolvedValue(tenant);
    const request: Record<string, any> = { headers: { 'x-api-key': 'key-1' } };

    const result = await guard.canActivate(makeContext(request));

    expect(result).toBe(true);
    expect(mockTenantsService.findByApiKey).toHaveBeenCalledWith('key-1');
    expect(request.tenant).toBe(tenant);
  });

  it('propagates the rejection when the tenant cannot be resolved', async () => {
    mockTenantsService.findByApiKey.mockRejectedValue(new Error('nope'));
    const request: Record<string, any> = { headers: {} };

    await expect(guard.canActivate(makeContext(request))).rejects.toThrow(
      'nope',
    );
    expect(request.tenant).toBeUndefined();
  });
});
