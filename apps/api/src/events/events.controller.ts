import { Body, Controller, Post } from '@nestjs/common';
import { AlertPipelineService } from './alert-pipeline.service.js';
import { CreateEventDto } from './create-event.dto.js';

@Controller('events')
export class EventsController {
  constructor(private readonly pipeline: AlertPipelineService) {}

  @Post()
  create(@Body() dto: CreateEventDto) {
    return this.pipeline.process(dto);
  }
}
