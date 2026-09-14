import { Controller } from '@nestjs/common';
import { EndpointsService } from './endpoints.service';

@Controller('endpoints')
export class EndpointsController {
  constructor(private readonly endpointsService: EndpointsService) {}
}
