import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Tenant } from './entities/tenant.entity';
import { Repository } from 'typeorm';
import { CreateTenantDto } from './dto/create-tenant.dto';

@Injectable()
export class TenantsService {
  constructor(
    @InjectRepository(Tenant)
    private readonly tenantsRepository: Repository<Tenant>,
  ) {}

  async create(dto: CreateTenantDto) {
    const apiKey = crypto.randomUUID();
    return await this.tenantsRepository.save({ ...dto, apiKey });
  }

  async findByApiKey(apiKey: string) {
    if (!apiKey) {
      throw new UnauthorizedException();
    }
    const current = await this.tenantsRepository.findOneBy({ apiKey });
    if (!current) {
      throw new UnauthorizedException();
    }
    return current;
  }
}
