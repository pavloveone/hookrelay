import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ECircuitState, Endpoint } from './entities/endpoint.entity';
import { Repository } from 'typeorm';
import { CreateEndpointDto } from './dto/create-endpoint.dto';
import { RecordAttemptResultDto } from './dto/record-attempt-result.dto';

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

  async recordAttemptResult({ endpointId, success }: RecordAttemptResultDto) {
    if (!endpointId) return;
    const currentEndpoint = await this.endpointsRepository.findOneBy({
      id: endpointId,
    });
    if (!currentEndpoint) {
      throw new Error(`An endpoint with id = ${endpointId} cannot be found`);
    }
    const nextConsecutiveFailures = currentEndpoint.consecutiveFailures + 1;
    const newState: Endpoint = { ...currentEndpoint };
    if (success) {
      newState.consecutiveFailures = 0;
      newState.circuitState = ECircuitState.CLOSED;
      newState.circuitOpenedAt = null;
    } else {
      newState.consecutiveFailures = nextConsecutiveFailures;
      if (nextConsecutiveFailures >= 5) {
        newState.circuitState = ECircuitState.OPEN;
        newState.circuitOpenedAt = new Date();
      }
    }
    return this.endpointsRepository.save({ ...newState });
  }
}
