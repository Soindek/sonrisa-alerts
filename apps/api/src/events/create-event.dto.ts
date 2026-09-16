import {
  IsArray,
  IsDateString,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { EVENT_TYPES, type EventType } from '../matching/event-type.js';

export class CreateEventDto {
  @IsIn(EVENT_TYPES)
  type: EventType;

  @IsInt()
  @Min(1)
  @Max(5)
  severity: number;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  summary: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsObject()
  payload?: Record<string, unknown>;

  @IsOptional()
  @IsDateString()
  occurredAt?: string;
}
