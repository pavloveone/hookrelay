import { of, throwError } from 'rxjs';
import { DeliveriesProcessor } from './deliveries.processor';
import { ECircuitState } from '../endpoints/entities/endpoint.entity';
import type { Job } from 'bullmq';

describe('DeliveriesProcessor', () => {
  let processor: DeliveriesProcessor;
  let mockDeliveriesService: {
    findOne: jest.Mock;
    updateStatus: jest.Mock;
  };
  let mockHttpService: { post: jest.Mock };
  let mockDeliveryAttemptsService: { create: jest.Mock };
  let mockEndpointsService: { recordAttemptResult: jest.Mock };
  let mockLogger: { info: jest.Mock; warn: jest.Mock };

  const baseDelivery = {
    id: 'delivery-1',
    endpoint: {
      id: 'endpoint-1',
      url: 'https://example.com/hook',
      secret: 'shh',
      circuitState: ECircuitState.CLOSED,
      circuitOpenedAt: null as Date | null,
    },
    event: {
      id: 'event-1',
      payload: { orderId: 123 },
    },
  };

  const makeJob = (
    overrides: Partial<{ attemptsMade: number; attempts: number }> = {},
  ): Job<{ deliveryId: string }> =>
    ({
      data: { deliveryId: 'delivery-1' },
      attemptsMade: overrides.attemptsMade ?? 0,
      opts: { attempts: overrides.attempts ?? 5 },
    }) as Job<{ deliveryId: string }>;

  beforeEach(() => {
    mockDeliveriesService = {
      findOne: jest.fn(),
      updateStatus: jest.fn(),
    };
    mockHttpService = {
      post: jest.fn(),
    };
    mockDeliveryAttemptsService = {
      create: jest.fn(),
    };
    mockEndpointsService = {
      recordAttemptResult: jest.fn(),
    };
    mockLogger = {
      info: jest.fn(),
      warn: jest.fn(),
    };

    processor = new DeliveriesProcessor(
      mockDeliveriesService as any,
      mockHttpService as any,
      mockDeliveryAttemptsService as any,
      mockEndpointsService as any,
      mockLogger as any,
    );
  });

  it('throws when the delivery cannot be found', async () => {
    mockDeliveriesService.findOne.mockResolvedValue(null);

    await expect(processor.process(makeJob())).rejects.toThrow(
      'A delivery with ID = delivery-1 cannot be found',
    );
  });

  it('skips the HTTP call and throws when the circuit is open and cooldown has not elapsed', async () => {
    mockDeliveriesService.findOne.mockResolvedValue({
      ...baseDelivery,
      endpoint: {
        ...baseDelivery.endpoint,
        circuitState: ECircuitState.OPEN,
        circuitOpenedAt: new Date(),
      },
    });

    await expect(processor.process(makeJob())).rejects.toThrow(
      'circuitState is open',
    );

    expect(mockHttpService.post).not.toHaveBeenCalled();
  });

  it('treats a missing circuitOpenedAt as long enough ago to skip immediately', async () => {
    mockDeliveriesService.findOne.mockResolvedValue({
      ...baseDelivery,
      endpoint: {
        ...baseDelivery.endpoint,
        circuitState: ECircuitState.OPEN,
        circuitOpenedAt: null,
      },
    });

    // circuitOpenedAt missing -> elapsed is computed from epoch 0, so this
    // still counts as "cooldown elapsed" and the request should go through.
    mockHttpService.post.mockReturnValue(
      of({ status: 200, data: { ok: true } }),
    );

    await processor.process(makeJob());

    expect(mockHttpService.post).toHaveBeenCalled();
  });

  it('attempts the request when the circuit is open but the cooldown has elapsed', async () => {
    mockDeliveriesService.findOne.mockResolvedValue({
      ...baseDelivery,
      endpoint: {
        ...baseDelivery.endpoint,
        circuitState: ECircuitState.OPEN,
        circuitOpenedAt: new Date(Date.now() - 120_000),
      },
    });
    mockHttpService.post.mockReturnValue(
      of({ status: 200, data: { ok: true } }),
    );

    await processor.process(makeJob());

    expect(mockHttpService.post).toHaveBeenCalled();
  });

  it('records success and marks the delivery succeeded', async () => {
    mockDeliveriesService.findOne.mockResolvedValue(baseDelivery);
    mockHttpService.post.mockReturnValue(
      of({ status: 200, data: { ok: true } }),
    );

    await processor.process(makeJob());

    expect(mockHttpService.post).toHaveBeenCalledWith(
      'https://example.com/hook',
      { orderId: 123 },
      { headers: { 'x-hookrelay-signature': expect.any(String) } },
    );
    expect(mockDeliveryAttemptsService.create).toHaveBeenCalledWith(
      expect.objectContaining({
        deliveryId: 'delivery-1',
        httpStatusCode: 200,
      }),
    );
    expect(mockDeliveriesService.updateStatus).toHaveBeenCalledWith(
      'delivery-1',
      'succeeded',
    );
    expect(mockEndpointsService.recordAttemptResult).toHaveBeenCalledWith({
      endpointId: 'endpoint-1',
      success: true,
    });
  });

  it('records a failed attempt and rethrows without marking exhausted mid-retry', async () => {
    mockDeliveriesService.findOne.mockResolvedValue(baseDelivery);
    const axiosError = {
      isAxiosError: true,
      message: 'Request failed with status code 500',
      response: { status: 500, data: 'oops' },
    };
    mockHttpService.post.mockReturnValue(throwError(() => axiosError));

    await expect(
      processor.process(makeJob({ attemptsMade: 1, attempts: 5 })),
    ).rejects.toBe(axiosError);

    expect(mockDeliveryAttemptsService.create).toHaveBeenCalledWith(
      expect.objectContaining({
        deliveryId: 'delivery-1',
        httpStatusCode: 500,
        error: axiosError.message,
      }),
    );
    expect(mockEndpointsService.recordAttemptResult).toHaveBeenCalledWith({
      endpointId: 'endpoint-1',
      success: false,
    });
    expect(mockDeliveriesService.updateStatus).not.toHaveBeenCalled();
  });

  it('marks the delivery exhausted when the final attempt fails', async () => {
    mockDeliveriesService.findOne.mockResolvedValue(baseDelivery);
    const axiosError = {
      isAxiosError: true,
      message: 'connect ECONNREFUSED',
      response: undefined,
    };
    mockHttpService.post.mockReturnValue(throwError(() => axiosError));

    await expect(
      processor.process(makeJob({ attemptsMade: 4, attempts: 5 })),
    ).rejects.toBe(axiosError);

    expect(mockDeliveriesService.updateStatus).toHaveBeenCalledWith(
      'delivery-1',
      'exhausted',
    );
  });

  it('does not log an attempt for a non-Axios failure, but still rethrows', async () => {
    mockDeliveriesService.findOne.mockResolvedValue(baseDelivery);
    const genericError = new Error('boom, something unrelated to HTTP');
    mockHttpService.post.mockReturnValue(throwError(() => genericError));

    await expect(processor.process(makeJob())).rejects.toBe(genericError);

    expect(mockDeliveryAttemptsService.create).not.toHaveBeenCalled();
    expect(mockEndpointsService.recordAttemptResult).not.toHaveBeenCalled();
  });

  it('treats a missing job.opts.attempts as already exhausted', async () => {
    mockDeliveriesService.findOne.mockResolvedValue(baseDelivery);
    const axiosError = {
      isAxiosError: true,
      message: 'connect ECONNREFUSED',
      response: undefined,
    };
    mockHttpService.post.mockReturnValue(throwError(() => axiosError));
    const job = {
      data: { deliveryId: 'delivery-1' },
      attemptsMade: 0,
      opts: {},
    } as unknown as Job<{ deliveryId: string }>;

    await expect(processor.process(job)).rejects.toBe(axiosError);

    expect(mockDeliveriesService.updateStatus).toHaveBeenCalledWith(
      'delivery-1',
      'exhausted',
    );
  });
});
