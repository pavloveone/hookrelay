import { Processor, WorkerHost } from '@nestjs/bullmq';
import { queues } from '../common/queue/queues';
import { Job } from 'bullmq';
import { DeliveriesService } from './deliveries.service';
import { ECircuitState } from '../endpoints/entities/endpoint.entity';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { DeliveryAttemptsService } from '../deliveryAttempts/deliveryAttempts.service';
import { EStatus } from './entities/delivery.entity';
import { isAxiosError } from 'axios';
import { EndpointsService } from '../endpoints/endpoints.service';

@Processor(queues.DELIVERIES)
export class DeliveriesProcessor extends WorkerHost {
  constructor(
    private readonly deliveriesService: DeliveriesService,
    private readonly httpService: HttpService,
    private readonly deliveryAttemptsServices: DeliveryAttemptsService,
    private readonly endpointsService: EndpointsService,
  ) {
    super();
  }
  async process(job: Job<{ deliveryId: string }>) {
    const { deliveryId } = job.data;
    const delivery = await this.deliveriesService.findOne(deliveryId);
    if (delivery?.endpoint?.circuitState === ECircuitState.OPEN) {
      const cooldownMs = 60_000;
      const elapsed =
        Date.now() - (delivery.endpoint.circuitOpenedAt?.getTime() ?? 0);
      if (elapsed < cooldownMs) {
        throw new Error('circuitState is open');
      }
    }
    const startTime = performance.now();
    try {
      const response = await firstValueFrom(
        this.httpService.post(
          delivery?.endpoint?.url ?? '',
          delivery?.event?.payload,
        ),
      );
      const durationMs = Math.round(performance.now() - startTime);
      await this.deliveryAttemptsServices.create({
        deliveryId,
        httpStatusCode: response.status,
        responseBody: JSON.stringify(response.data),
        durationMs,
      });
      await this.deliveriesService.updateStatus(deliveryId, EStatus.SUCCEEDED);
      return await this.endpointsService.recordAttemptResult({
        endpointId: delivery?.endpoint?.id,
        success: true,
      });
    } catch (error) {
      if (isAxiosError(error)) {
        const durationMs = Math.round(performance.now() - startTime);
        await this.deliveryAttemptsServices.create({
          deliveryId,
          httpStatusCode: error.response?.status,
          responseBody: error.response?.data
            ? JSON.stringify(error.response.data)
            : undefined,
          error: error.message,
          durationMs,
        });
        await this.endpointsService.recordAttemptResult({
          endpointId: delivery?.endpoint?.id,
          success: false,
        });
      }
      throw error;
    }
  }
}
