import { UnauthorizedException } from '@nestjs/common';
import { TenantsService } from './tenants.service';

describe('TenantsService', () => {
  let service: TenantsService;
  let mockRepository: { save: jest.Mock; findOneBy: jest.Mock };

  beforeEach(() => {
    mockRepository = {
      save: jest.fn(),
      findOneBy: jest.fn(),
    };
    service = new TenantsService(mockRepository as any);
  });

  describe('create', () => {
    it('saves the tenant with a generated apiKey', async () => {
      mockRepository.save.mockImplementation(async (entity) => ({
        id: 'tenant-1',
        ...entity,
      }));

      const result = await service.create({ name: 'Acme' });

      expect(mockRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Acme',
          apiKey: expect.any(String),
        }),
      );
      expect(result.apiKey).toBeTruthy();
    });
  });

  describe('findByApiKey', () => {
    it('throws Unauthorized when no api key is given', async () => {
      await expect(
        service.findByApiKey(undefined as unknown as string),
      ).rejects.toThrow(UnauthorizedException);
      expect(mockRepository.findOneBy).not.toHaveBeenCalled();
    });

    it('throws Unauthorized when no tenant matches the api key', async () => {
      mockRepository.findOneBy.mockResolvedValue(null);

      await expect(service.findByApiKey('bad-key')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('returns the matching tenant', async () => {
      const tenant = { id: 'tenant-1', apiKey: 'good-key' };
      mockRepository.findOneBy.mockResolvedValue(tenant);

      const result = await service.findByApiKey('good-key');

      expect(result).toBe(tenant);
      expect(mockRepository.findOneBy).toHaveBeenCalledWith({
        apiKey: 'good-key',
      });
    });
  });
});
