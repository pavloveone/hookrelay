import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { EventsService } from './events.service';
import { CreateEventDto } from './dto/create-event.dto';
import { ApiKeyGuard } from '../common/guards/api-key.guard';

@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @UseGuards(ApiKeyGuard)
  @Post()
  createEvent(@Body() dto: CreateEventDto, @Req() req: any) {
    return this.eventsService.createEvent(dto, req);
  }
}
