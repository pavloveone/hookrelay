import { BadRequestException, NotFoundException } from '@nestjs/common';
import { DeliveriesService } from './deliveries.service';
import { EStatus } from './entities/delivery.entity';

describe('DeliveriesService', () => {
  let service: DeliveriesService;
  let mockRepository: {
    save: jest.Mock;
    findOneBy: jest.Mock;
    createQueryBuilder: jest.Mock;
  };
  let mockQueryBuilder: {
    leftJoinAndSelect: jest.Mock;
    addSelect: jest.Mock;
    where: jest.Mock;
    andWhere: jest.Mock;
    getOne: jest.Mock;
    getMany: jest.Mock;
  };
  let mockQueue: { add: jest.Mock };

  const req = { tenant: { id: 'tenant-1' } } as any;

  beforeEach(() => {
    mockQueryBuilder = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getOne: jest.fn(),
      getMany: jest.fn(),
    };
    mockRepository = {
      save: jest.fn(),
      findOneBy: jest.fn(),
      createQueryBuilder: jest.fn(() => mockQueryBuilder),
    };
    mockQueue = {
      add: jest.fn(),
    };

    service = new DeliveriesService(mockRepository as any, mockQueue as any);
  });

  describe('create', () => {
    it('saves a delivery linking the given event and endpoint', () => {
      service.create({ eventId: 'event-1', endpointId: 'endpoint-1' });

      expect(mockRepository.save).toHaveBeenCalledWith({
        event: { id: 'event-1' },
        endpoint: { id: 'endpoint-1' },
      });
    });
  });

  describe('findOne', () => {
    it('builds a query that includes the normally-hidden endpoint secret', async () => {
      mockQueryBuilder.getOne.mockResolvedValue({ id: 'delivery-1' });

      const result = await service.findOne('delivery-1');

      expect(mockRepository.createQueryBuilder).toHaveBeenCalledWith(
        'delivery',
      );
      expect(mockQueryBuilder.addSelect).toHaveBeenCalledWith(
        'endpoint.secret',
      );
      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'delivery.id = :id',
        { id: 'delivery-1' },
      );
      expect(result).toEqual({ id: 'delivery-1' });
    });
  });

  describe('updateStatus', () => {
    it('merges the new status onto the existing delivery and saves it', async () => {
      mockRepository.findOneBy.mockResolvedValue({
        id: 'delivery-1',
        status: EStatus.PENDING,
      });

      await service.updateStatus('delivery-1', EStatus.SUCCEEDED);

      expect(mockRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'delivery-1',
          status: EStatus.SUCCEEDED,
        }),
      );
    });
  });

  describe('getDeliveriesByTenant', () => {
    it('filters deliveries by the endpoint owner tenant', () => {
      service.getDeliveriesByTenant(req);

      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'endpoint.tenant.id = :tenantId',
        { tenantId: 'tenant-1' },
      );
    });
  });

  describe('getDeliveryByTenant', () => {
    it('returns the delivery when it belongs to the requesting tenant', async () => {
      const delivery = { id: 'delivery-1' };
      mockQueryBuilder.getOne.mockResolvedValue(delivery);

      const result = await service.getDeliveryByTenant('delivery-1', req);

      expect(result).toBe(delivery);
    });

    it('throws NotFound when no delivery matches (missing or someone else’s)', async () => {
      mockQueryBuilder.getOne.mockResolvedValue(null);

      await expect(
        service.getDeliveryByTenant('delivery-1', req),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('replay', () => {
    it('requeues an exhausted delivery and resets it to pending', async () => {
      mockQueryBuilder.getOne.mockResolvedValue({
        id: 'delivery-1',
        status: EStatus.EXHAUSTED,
      });

      await service.replay('delivery-1', req);

      expect(mockRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'delivery-1', status: EStatus.PENDING }),
      );
      expect(mockQueue.add).toHaveBeenCalledWith(
        'deliver',
        { deliveryId: 'delivery-1' },
        { attempts: 5, backoff: { type: 'exponential', delay: 1000 } },
      );
    });

    it('refuses to replay a delivery that is not exhausted', async () => {
      mockQueryBuilder.getOne.mockResolvedValue({
        id: 'delivery-1',
        status: EStatus.PENDING,
      });

      await expect(service.replay('delivery-1', req)).rejects.toThrow(
        BadRequestException,
      );
      expect(mockQueue.add).not.toHaveBeenCalled();
    });
  });
});
