import { ArrayNotEmpty, IsArray, IsIn, IsInt, IsString, IsUUID, Max, Min } from 'class-validator';
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

  /** Trimmed and empty entries dropped by the controller; empty = no keyword filter. */
  @IsArray()
  @IsString({ each: true })
  keywords: string[];

  /** Every id must be registered; checked by the controller against ChannelRegistry. */
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  channels: string[];
}
