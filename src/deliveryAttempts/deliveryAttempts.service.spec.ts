import { DeliveryAttemptsService } from './deliveryAttempts.service';

describe('DeliveryAttemptsService', () => {
  let service: DeliveryAttemptsService;
  let mockRepository: { save: jest.Mock };

  beforeEach(() => {
    mockRepository = {
      save: jest.fn(),
    };
    service = new DeliveryAttemptsService(mockRepository as any);
  });

  describe('create', () => {
    it('saves the attempt linked to the given delivery', () => {
      service.create({
        deliveryId: 'delivery-1',
        httpStatusCode: 200,
        responseBody: '{"ok":true}',
        durationMs: 42,
      });

      expect(mockRepository.save).toHaveBeenCalledWith({
        deliveryId: 'delivery-1',
        httpStatusCode: 200,
        responseBody: '{"ok":true}',
        durationMs: 42,
        delivery: { id: 'delivery-1' },
      });
    });
  });
});
