import { Controller, Get } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Delivery } from '../entities/delivery.entity.js';

@Controller('deliveries')
export class DeliveriesController {
  constructor(@InjectRepository(Delivery) private readonly deliveries: Repository<Delivery>) {}

  @Get()
  list(): Promise<Delivery[]> {
    return this.deliveries.find({ order: { createdAt: 'DESC' }, take: 100 });
  }
}
