import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ECircuitState, Endpoint } from './entities/endpoint.entity';
import { Repository } from 'typeorm';
import { CreateEndpointDto } from './dto/create-endpoint.dto';
import * as apiKeyGuard from '../common/guards/api-key.guard';
import { RecordAttemptResultDto } from './dto/record-attempt-result.dto';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';

@Injectable()
export class EndpointsService {
  constructor(
    @InjectRepository(Endpoint)
    private readonly endpointsRepository: Repository<Endpoint>,
    @InjectPinoLogger(EndpointsService.name)
    private readonly logger: PinoLogger,
  ) {}

  getEndpointsByTenant(req: apiKeyGuard.IRequest) {
    return this.endpointsRepository.find({
      where: { tenant: { id: req.tenant.id } },
    });
  }

  async getEndpointByTenant(id: string, req: apiKeyGuard.IRequest) {
    const currentEndpoint = await this.endpointsRepository.findOne({
      where: { id },
      relations: { tenant: true, deliveries: true },
    });
    if (req.tenant.id !== currentEndpoint?.tenant.id) {
      throw new NotFoundException();
    }
    return { ...currentEndpoint, tenant: null };
  }

  create(dto: CreateEndpointDto, req: apiKeyGuard.IRequest) {
    const secret = crypto.randomUUID();
    return this.endpointsRepository.save({
      tenant: { id: req.tenant.id },
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
    if (
      currentEndpoint.circuitState !== newState.circuitState &&
      newState.circuitState === ECircuitState.OPEN
    ) {
      this.logger.warn(
        { endpointId, consecutiveFailures: nextConsecutiveFailures },
        'circuit opened',
      );
    }
    if (
      currentEndpoint.circuitState !== newState.circuitState &&
      newState.circuitState === ECircuitState.CLOSED
    ) {
      this.logger.info({ endpointId }, 'circuit closed');
    }
    return this.endpointsRepository.save({ ...newState });
  }
}
