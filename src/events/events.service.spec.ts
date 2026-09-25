import { QueryFailedError } from 'typeorm';
import { EventsService } from './events.service';

describe('EventsService', () => {
  let service: EventsService;
  let mockEventsRepository: { save: jest.Mock; findOne: jest.Mock };
  let mockQueryBuilder: {
    where: jest.Mock;
    andWhere: jest.Mock;
    getMany: jest.Mock;
  };
  let mockEndpointsRepository: { createQueryBuilder: jest.Mock };
  let mockDeliveriesService: { create: jest.Mock };
  let mockQueue: { add: jest.Mock };
  let mockLogger: { info: jest.Mock; warn: jest.Mock };

  const req = { tenant: { id: 'tenant-1' } };

  beforeEach(() => {
    mockEventsRepository = {
      save: jest.fn(),
      findOne: jest.fn(),
    };
    mockQueryBuilder = {
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getMany: jest.fn(),
    };
    mockEndpointsRepository = {
      createQueryBuilder: jest.fn(() => mockQueryBuilder),
    };
    mockDeliveriesService = {
      create: jest.fn(),
    };
    mockQueue = {
      add: jest.fn(),
    };
    mockLogger = {
      info: jest.fn(),
      warn: jest.fn(),
    };

    service = new EventsService(
      mockEventsRepository as any,
      mockEndpointsRepository as any,
      mockDeliveriesService as any,
      mockQueue as any,
      mockLogger as any,
    );
  });

  describe('createEvent', () => {
    it('creates the event and returns it when there are no matching endpoints', async () => {
      const newEvent = { id: 'event-1', eventType: 'order.created' };
      mockEventsRepository.save.mockResolvedValue(newEvent);
      mockQueryBuilder.getMany.mockResolvedValue([]);

      const result = await service.createEvent(
        {
          eventType: 'order.created',
          payload: { x: 1 },
          idempotencyKey: 'key-1',
        },
        req,
      );

      expect(result).toBe(newEvent);
      expect(mockDeliveriesService.create).not.toHaveBeenCalled();
      expect(mockQueue.add).not.toHaveBeenCalled();
    });

    it('fans out to every matching endpoint, one delivery and one queued job each', async () => {
      const newEvent = { id: 'event-1', eventType: 'order.created' };
      mockEventsRepository.save.mockResolvedValue(newEvent);
      mockQueryBuilder.getMany.mockResolvedValue([
        { id: 'endpoint-1' },
        { id: 'endpoint-2' },
      ]);
      mockDeliveriesService.create.mockImplementation(
        async ({ endpointId }: { endpointId: string }) => ({
          id: `delivery-${endpointId}`,
        }),
      );

      await service.createEvent(
        {
          eventType: 'order.created',
          payload: { x: 1 },
          idempotencyKey: 'key-1',
        },
        req,
      );

      expect(mockDeliveriesService.create).toHaveBeenCalledTimes(2);
      expect(mockDeliveriesService.create).toHaveBeenCalledWith({
        endpointId: 'endpoint-1',
        eventId: 'event-1',
      });
      expect(mockDeliveriesService.create).toHaveBeenCalledWith({
        endpointId: 'endpoint-2',
        eventId: 'event-1',
      });
      expect(mockQueue.add).toHaveBeenCalledTimes(2);
      expect(mockQueue.add).toHaveBeenCalledWith(
        'deliver',
        { deliveryId: 'delivery-endpoint-1' },
        { attempts: 5, backoff: { type: 'exponential', delay: 1000 } },
      );
    });

    it('returns the existing event instead of creating a duplicate on a race', async () => {
      const conflictError = new QueryFailedError('INSERT INTO event ...', [], {
        code: '23505',
      } as any);
      mockEventsRepository.save.mockRejectedValue(conflictError);
      const existingEvent = { id: 'event-existing', eventType: 'order.created' };
      mockEventsRepository.findOne.mockResolvedValue(existingEvent);

      const result = await service.createEvent(
        {
          eventType: 'order.created',
          payload: { x: 1 },
          idempotencyKey: 'key-1',
        },
        req,
      );

      expect(result).toBe(existingEvent);
      expect(mockEventsRepository.findOne).toHaveBeenCalledWith({
        where: { idempotencyKey: 'key-1', tenant: { id: 'tenant-1' } },
      });
      expect(mockDeliveriesService.create).not.toHaveBeenCalled();
    });

    it('rethrows when the database error is not a unique-constraint conflict', async () => {
      const otherError = new QueryFailedError('INSERT INTO event ...', [], {
        code: '23502',
      } as any);
      mockEventsRepository.save.mockRejectedValue(otherError);

      await expect(
        service.createEvent(
          {
            eventType: 'order.created',
            payload: { x: 1 },
            idempotencyKey: 'key-1',
          },
          req,
        ),
      ).rejects.toThrow();

      expect(mockEventsRepository.findOne).not.toHaveBeenCalled();
    });
  });
});
