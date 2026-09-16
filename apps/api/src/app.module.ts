import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChannelsController } from './channels/channels.controller.js';
import { ChannelsModule } from './channels/channels.module.js';
import { postgresConfig } from './config.js';
import { DeliveriesController } from './deliveries/deliveries.controller.js';
import { AlertRule } from './entities/alert-rule.entity.js';
import { Delivery } from './entities/delivery.entity.js';
import { Event } from './entities/event.entity.js';
import { User } from './entities/user.entity.js';
import { AlertPipelineService } from './events/alert-pipeline.service.js';
import { EventsController } from './events/events.controller.js';
import { RulesController } from './rules/rules.controller.js';
import { SeedService } from './seed/seed.service.js';
import { UsersController } from './users/users.controller.js';

const entities = [User, AlertRule, Event, Delivery];

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      useFactory: () => ({
        type: 'postgres',
        ...postgresConfig(),
        entities,
        synchronize: process.env.NODE_ENV !== 'production',
      }),
    }),
    TypeOrmModule.forFeature(entities),
    ChannelsModule,
  ],
  controllers: [EventsController, DeliveriesController, ChannelsController, UsersController, RulesController],
  providers: [AlertPipelineService, SeedService],
})
export class AppModule {}
