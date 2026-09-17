import {
  ArrayMaxSize,
  ArrayNotEmpty,
  IsArray,
  IsIn,
  IsInt,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { EVENT_TYPES, type EventType } from '../matching/event-type.js';

export class CreateRuleDto {
  @IsUUID()
  userId: string;

  /** Empty = any type. */
  @IsArray()
  @IsIn(EVENT_TYPES, { each: true })
  eventTypes: EventType[];

  @IsInt()
  @Min(1)
  @Max(5)
  minSeverity: number;

  /** Trimmed, empty entries dropped and entries without a letter or digit rejected by the controller; empty = no keyword filter. */
  @IsArray()
  @ArrayMaxSize(20)
  @IsString({ each: true })
  @MaxLength(100, { each: true })
  keywords: string[];

  /** Every id must be registered; checked by the controller against ChannelRegistry, duplicates dropped. */
  @IsArray()
  @ArrayNotEmpty()
  @ArrayMaxSize(10)
  @IsString({ each: true })
  @MaxLength(50, { each: true })
  channels: string[];
}
