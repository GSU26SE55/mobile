import { describe, expect, it } from 'vitest';
import { createTicketSchema } from './createTicket.schema';
import { TicketCategoryEnum } from '@/src/shared/enums/ticket.enum';

const ID_A = '3f2504e0-4f89-11d3-9a0c-0305e82c3301';
const ID_B = '3f2504e0-4f89-11d3-9a0c-0305e82c3302';

const base = {
  title: 'Battery Issue - SN-001',
  description: 'Pin nóng bất thường khi sạc',
  category: TicketCategoryEnum.Other,
  batteryAssetIds: [ID_A],
  incidentDetectedAt: new Date(Date.now() - 3600_000).toISOString(),
};

const parse = (o: Partial<typeof base>) => createTicketSchema.safeParse({ ...base, ...o });

describe('createTicketSchema — 1 ticket = 1 pin', () => {
  it('nhận đúng một viên pin', () => {
    expect(parse({}).success).toBe(true);
  });

  // BE: TicketCreateCommand yêu cầu BatteryAssetIds.Count == 1, không phải ">= 1".
  it('từ chối hai viên pin', () => {
    const r = parse({ batteryAssetIds: [ID_A, ID_B] });
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error.issues[0].message).toBe('Select exactly one battery');
  });

  it('từ chối danh sách rỗng', () => {
    expect(parse({ batteryAssetIds: [] }).success).toBe(false);
  });

  it('từ chối thời điểm phát hiện ở tương lai', () => {
    expect(parse({ incidentDetectedAt: new Date(Date.now() + 3600_000).toISOString() }).success).toBe(false);
  });

  it('từ chối mô tả dưới 5 ký tự', () => {
    expect(parse({ description: 'abc' }).success).toBe(false);
  });
});
