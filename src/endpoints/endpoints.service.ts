import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Endpoint } from './entities/endpoint.entity';
import { Repository } from 'typeorm';
import { CreateEndpointDto } from './dto/create-endpoint.dto';

@Injectable()
export class EndpointsService {
  constructor(
    @InjectRepository(Endpoint)
    private readonly endpointsRepository: Repository<Endpoint>,
  ) {}

  create(dto: CreateEndpointDto) {
    const secret = crypto.randomUUID();
    return this.endpointsRepository.save({
      tenant: { id: dto.tenantId },
      url: dto.url,
      secret,
      subscribedEventTypes: dto.subscribedEventTypes,
    });
  }
}
