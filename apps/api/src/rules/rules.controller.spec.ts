import { BadRequestException, NotFoundException } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import type { Repository } from 'typeorm';
import { ChannelRegistry } from '../channels/channel-registry.js';
import type { NotificationChannel } from '../channels/notification-channel.js';
import type { AlertRule } from '../entities/alert-rule.entity.js';
import type { User } from '../entities/user.entity.js';
import { CreateRuleDto } from './create-rule.dto.js';
import { RulesController } from './rules.controller.js';

const USER_ID = '6f1c2a4e-2b1d-4c7a-9e3f-0a1b2c3d4e5f';

function channel(id: string): NotificationChannel {
  return { id, send: () => Promise.resolve({ status: 'sent' }) };
}

function dto(overrides: Partial<CreateRuleDto> = {}): CreateRuleDto {
  return { userId: USER_ID, eventTypes: ['news'], minSeverity: 2, keywords: [], channels: ['slack'], ...overrides };
}

function setup({ userExists = true, affected = 1 } = {}) {
  const save = vi.fn((rule: Partial<AlertRule>) => Promise.resolve({ id: 'r1', ...rule }));
  const remove = vi.fn().mockResolvedValue({ affected, raw: [] });
  const existsBy = vi.fn().mockResolvedValue(userExists);
  const controller = new RulesController(
    { create: (rule: Partial<AlertRule>) => rule, save, delete: remove } as unknown as Repository<AlertRule>,
    { existsBy } as unknown as Repository<User>,
    new ChannelRegistry([channel('email'), channel('slack')]),
  );
  return { controller, save, remove, existsBy };
}

describe('CreateRuleDto', () => {
  it('accepts empty event types and keywords', async () => {
    expect(await validate(plainToInstance(CreateRuleDto, dto({ eventTypes: [], keywords: [] })))).toEqual([]);
  });

  it('accepts keywords and channels at their size limits', async () => {
    const atLimits = dto({
      keywords: Array.from({ length: 20 }, () => 'a'.repeat(100)),
      channels: Array.from({ length: 10 }, () => 'c'.repeat(50)),
    });

    expect(await validate(plainToInstance(CreateRuleDto, atLimits))).toEqual([]);
  });

  it.each([
    ['a non-uuid userId', { userId: 'bence' }, 'userId'],
    ['an unknown event type', { eventTypes: ['sports'] }, 'eventTypes'],
    ['a fractional severity', { minSeverity: 2.5 }, 'minSeverity'],
    ['a severity above 5', { minSeverity: 6 }, 'minSeverity'],
    ['an empty channel list', { channels: [] }, 'channels'],
    ['more than 20 keywords', { keywords: Array.from({ length: 21 }, (_, i) => `k${i}`) }, 'keywords'],
    ['a keyword longer than 100 characters', { keywords: ['a'.repeat(101)] }, 'keywords'],
    ['more than 10 channels', { channels: Array.from({ length: 11 }, (_, i) => `c${i}`) }, 'channels'],
    ['a channel id longer than 50 characters', { channels: ['c'.repeat(51)] }, 'channels'],
  ])('rejects %s', async (_, overrides, property) => {
    const errors = await validate(plainToInstance(CreateRuleDto, dto(overrides as Partial<CreateRuleDto>)));

    expect(errors.map((error) => error.property)).toEqual([property]);
  });
});

describe('RulesController', () => {
  it('saves the rule with trimmed keywords and empty entries dropped', async () => {
    const { controller, save } = setup();

    const rule = await controller.create(dto({ keywords: ['  election ', '', '   ', 'interest rate'] }));

    expect(save).toHaveBeenCalledExactlyOnceWith({
      userId: USER_ID,
      eventTypes: ['news'],
      minSeverity: 2,
      keywords: ['election', 'interest rate'],
      channels: ['slack'],
    });
    expect(rule).toMatchObject({ id: 'r1', keywords: ['election', 'interest rate'] });
  });

  it('rejects keywords without a letter or digit with 400, listing each one', async () => {
    const { controller, save } = setup();

    const result = controller.create(dto({ keywords: ['election', ' !!! ', '', '--', 'Ár 5%'] }));

    await expect(result).rejects.toThrow(BadRequestException);
    await expect(result).rejects.toThrow('Keywords need at least one letter or digit: !!!, --');
    expect(save).not.toHaveBeenCalled();
  });

  it('saves channels deduplicated in first-seen order', async () => {
    const { controller, save } = setup();

    await controller.create(dto({ channels: ['slack', 'email', 'slack', 'email'] }));

    expect(save).toHaveBeenCalledWith(expect.objectContaining({ channels: ['slack', 'email'] }));
  });

  it('rejects unknown channels with 400, listing every unknown id', async () => {
    const { controller, save } = setup();

    const result = controller.create(dto({ channels: ['sms', 'email', 'pager'] }));

    await expect(result).rejects.toThrow(BadRequestException);
    await expect(result).rejects.toThrow('Unknown channels: sms, pager');
    expect(save).not.toHaveBeenCalled();
  });

  it('rejects an unknown user with 404', async () => {
    const { controller, save, existsBy } = setup({ userExists: false });

    const result = controller.create(dto());

    await expect(result).rejects.toThrow(NotFoundException);
    expect(existsBy).toHaveBeenCalledWith({ id: USER_ID });
    expect(save).not.toHaveBeenCalled();
  });

  it('deletes an existing rule', async () => {
    const { controller, remove } = setup();

    await expect(controller.remove('r1')).resolves.toBeUndefined();
    expect(remove).toHaveBeenCalledWith({ id: 'r1' });
  });

  it('returns 404 when deleting a missing rule', async () => {
    const { controller } = setup({ affected: 0 });

    await expect(controller.remove('r-gone')).rejects.toThrow(NotFoundException);
  });
});
