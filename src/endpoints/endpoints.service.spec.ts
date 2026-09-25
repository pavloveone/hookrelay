import { NotFoundException } from '@nestjs/common';
import { EndpointsService } from './endpoints.service';
import { ECircuitState } from './entities/endpoint.entity';

describe('EndpointsService', () => {
  let service: EndpointsService;
  let mockRepository: {
    findOneBy: jest.Mock;
    save: jest.Mock;
    find: jest.Mock;
    findOne: jest.Mock;
  };
  let mockLogger: { info: jest.Mock; warn: jest.Mock };

  beforeEach(() => {
    mockRepository = {
      findOneBy: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
    };
    mockLogger = {
      info: jest.fn(),
      warn: jest.fn(),
    };

    service = new EndpointsService(
      mockRepository as any,
      mockLogger as any,
    );
  });

  describe('recordAttemptResult', () => {
    it('opens the circuit once consecutive failures reach the threshold', async () => {
      mockRepository.findOneBy.mockResolvedValue({
        id: 'endpoint-1',
        consecutiveFailures: 4,
        circuitState: ECircuitState.CLOSED,
        circuitOpenedAt: null,
      });

      await service.recordAttemptResult({
        endpointId: 'endpoint-1',
        success: false,
      });

      expect(mockRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          consecutiveFailures: 5,
          circuitState: ECircuitState.OPEN,
          circuitOpenedAt: expect.any(Date),
        }),
      );
    });

    it('does not open the circuit before the threshold is reached', async () => {
      mockRepository.findOneBy.mockResolvedValue({
        id: 'endpoint-1',
        consecutiveFailures: 1,
        circuitState: ECircuitState.CLOSED,
        circuitOpenedAt: null,
      });

      await service.recordAttemptResult({
        endpointId: 'endpoint-1',
        success: false,
      });

      expect(mockRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          consecutiveFailures: 2,
          circuitState: ECircuitState.CLOSED,
        }),
      );
    });

    it('closes the circuit and resets the failure count on success', async () => {
      mockRepository.findOneBy.mockResolvedValue({
        id: 'endpoint-1',
        consecutiveFailures: 5,
        circuitState: ECircuitState.OPEN,
        circuitOpenedAt: new Date(),
      });

      await service.recordAttemptResult({
        endpointId: 'endpoint-1',
        success: true,
      });

      expect(mockRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          consecutiveFailures: 0,
          circuitState: ECircuitState.CLOSED,
          circuitOpenedAt: null,
        }),
      );
    });

    it('does nothing when the endpoint id is missing', async () => {
      await service.recordAttemptResult({
        endpointId: undefined as unknown as string,
        success: true,
      });

      expect(mockRepository.findOneBy).not.toHaveBeenCalled();
      expect(mockRepository.save).not.toHaveBeenCalled();
    });

    it('throws when the endpoint cannot be found', async () => {
      mockRepository.findOneBy.mockResolvedValue(null);

      await expect(
        service.recordAttemptResult({
          endpointId: 'missing-endpoint',
          success: true,
        }),
      ).rejects.toThrow(
        'An endpoint with id = missing-endpoint cannot be found',
      );
    });
  });

  describe('create', () => {
    it('saves the endpoint with a generated secret, scoped to the requesting tenant', async () => {
      mockRepository.save.mockImplementation(async (entity) => entity);
      const req = { tenant: { id: 'tenant-1' } } as any;

      const result = await service.create(
        { url: 'https://example.com/hook', subscribedEventTypes: ['x'] },
        req,
      );

      expect(mockRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          tenant: { id: 'tenant-1' },
          url: 'https://example.com/hook',
          subscribedEventTypes: ['x'],
          secret: expect.any(String),
        }),
      );
      expect(result.secret).toBeTruthy();
    });
  });

  describe('getEndpointsByTenant', () => {
    it('queries endpoints scoped to the requesting tenant', () => {
      const req = { tenant: { id: 'tenant-1' } } as any;

      service.getEndpointsByTenant(req);

      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { tenant: { id: 'tenant-1' } },
      });
    });
  });

  describe('getEndpointByTenant', () => {
    it('returns the endpoint (with tenant stripped) when it belongs to the requester', async () => {
      mockRepository.findOne.mockResolvedValue({
        id: 'endpoint-1',
        tenant: { id: 'tenant-1' },
        url: 'https://example.com/hook',
      });
      const req = { tenant: { id: 'tenant-1' } } as any;

      const result = await service.getEndpointByTenant('endpoint-1', req);

      expect(result.tenant).toBeNull();
      expect(result.id).toBe('endpoint-1');
    });

    it('throws NotFound when the endpoint belongs to a different tenant', async () => {
      mockRepository.findOne.mockResolvedValue({
        id: 'endpoint-1',
        tenant: { id: 'someone-elses-tenant' },
      });
      const req = { tenant: { id: 'tenant-1' } } as any;

      await expect(
        service.getEndpointByTenant('endpoint-1', req),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws NotFound when the endpoint does not exist', async () => {
      mockRepository.findOne.mockResolvedValue(null);
      const req = { tenant: { id: 'tenant-1' } } as any;

      await expect(
        service.getEndpointByTenant('missing', req),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
