import { EndpointsService } from './endpoints.service';
import { ECircuitState } from './entities/endpoint.entity';

describe('EndpointsService', () => {
  let service: EndpointsService;
  let mockRepository: { findOneBy: jest.Mock; save: jest.Mock };
  let mockLogger: { info: jest.Mock; warn: jest.Mock };

  beforeEach(() => {
    mockRepository = {
      findOneBy: jest.fn(),
      save: jest.fn(),
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
});
