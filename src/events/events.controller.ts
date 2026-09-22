import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { EventsService } from './events.service';
import { CreateEventDto } from './dto/create-event.dto';
import { ApiKeyGuard } from '../common/guards/api-key.guard';
import { TenantThrottlerGuard } from '../common/guards/tenant-throttler.guard';

@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @UseGuards(ApiKeyGuard, TenantThrottlerGuard)
  @Post()
  createEvent(@Body() dto: CreateEventDto, @Req() req: Record<string, any>) {
    return this.eventsService.createEvent(dto, req);
  }
}
