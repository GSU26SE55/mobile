import { describe, expect, it } from 'vitest';
import {
  canCustomerSchedule,
  daysLeftToSchedule,
  rejectionMessage,
  validateChosenTime,
} from './periodicMaintenanceSchedule';
import { TicketStatusEnum } from '@/src/shared/enums/ticket.enum';
import type { TicketDetailDTO } from '../types/ticket.types';

const NOW = new Date('2026-09-10T03:00:00.000Z');
const iso = (days: number) =>
  new Date(NOW.getTime() + days * 24 * 60 * 60 * 1000).toISOString();

const ticket = (over: Partial<TicketDetailDTO> = {}) =>
  ({
    isPeriodicMaintenance: true,
    status: TicketStatusEnum.Open,
    scheduledStartAtUtc: null,
    periodicMaintenanceScheduleDeadlineAtUtc: iso(7),
    ...over,
  }) as TicketDetailDTO;

describe('canCustomerSchedule', () => {
  it('ticket bảo trì định kỳ còn Open, chưa chọn giờ, còn hạn thì cho chọn', () => {
    expect(canCustomerSchedule(ticket(), NOW)).toBe(true);
  });

  it('ticket thường không dùng ô này', () => {
    expect(canCustomerSchedule(ticket({ isPeriodicMaintenance: false }), NOW)).toBe(false);
  });

  // Đã giao rồi thì lịch thuộc về Manager — khách đổi được sẽ phá lịch của kỹ thuật viên.
  it.each([
    TicketStatusEnum.InProgress,
    TicketStatusEnum.Pending,
    TicketStatusEnum.Completed,
    TicketStatusEnum.Closed,
  ])('trạng thái %s thì không cho chọn', (status) => {
    expect(canCustomerSchedule(ticket({ status }), NOW)).toBe(false);
  });

  it('đã chọn giờ rồi thì ô biến mất', () => {
    expect(canCustomerSchedule(ticket({ scheduledStartAtUtc: iso(3) }), NOW)).toBe(false);
  });

  // Hết cửa sổ thì Manager tự sắp — worker nhắc lịch đã bàn việc cho Manager ở mốc thứ ba.
  it('quá hạn chót thì không cho chọn nữa', () => {
    expect(canCustomerSchedule(
      ticket({ periodicMaintenanceScheduleDeadlineAtUtc: iso(-1) }), NOW)).toBe(false);
  });

  it('không có hạn chót thì không cho chọn', () => {
    expect(canCustomerSchedule(
      ticket({ periodicMaintenanceScheduleDeadlineAtUtc: null }), NOW)).toBe(false);
  });
});

describe('validateChosenTime', () => {
  it('giờ nằm trong cửa sổ thì hợp lệ', () => {
    expect(validateChosenTime(new Date(iso(3)), iso(7), NOW)).toBeNull();
  });

  it('giờ ở quá khứ bị từ chối', () => {
    expect(validateChosenTime(new Date(iso(-1)), iso(7), NOW)).toBe('past');
  });

  it('giờ vượt hạn chót bị từ chối', () => {
    expect(validateChosenTime(new Date(iso(9)), iso(7), NOW)).toBe('after-deadline');
  });

  it('thiếu hạn chót thì không quyết được', () => {
    expect(validateChosenTime(new Date(iso(3)), null, NOW)).toBe('no-deadline');
  });

  // Đúng bằng hạn chót vẫn nhận — backend dùng phép so sánh lớn hơn, hai bên phải khớp,
  // nếu không khách bị chặn ở máy cho một giờ mà máy chủ chấp nhận.
  it('đúng bằng hạn chót thì vẫn hợp lệ', () => {
    expect(validateChosenTime(new Date(iso(7)), iso(7), NOW)).toBeNull();
  });
});

describe('rejectionMessage', () => {
  const fmt = (v: string) => `[${v}]`;

  it('câu báo vượt hạn nêu rõ hạn chót, không nói chung chung', () => {
    const message = rejectionMessage('after-deadline', iso(7), fmt);
    expect(message).toContain(fmt(iso(7)));
  });

  it('thiếu hạn chót thì vẫn có câu đọc được', () => {
    expect(rejectionMessage('after-deadline', null, fmt)).toMatch(/deadline/i);
  });

  it.each(['past', 'no-deadline'] as const)('lý do %s có câu riêng', (reason) => {
    expect(rejectionMessage(reason, iso(7), fmt)).not.toBe('');
  });
});

describe('daysLeftToSchedule', () => {
  it.each([
    [7, 7],
    [3, 3],
    [1, 1],
  ])('còn %s ngày → %s', (days, expected) => {
    expect(daysLeftToSchedule(iso(days), NOW)).toBe(expected);
  });

  // Làm tròn LÊN: còn 1 giờ mà hiện "0 ngày" thì đọc như đã hết hạn, trong khi vẫn chọn được.
  it('còn vài giờ vẫn tính là 1 ngày', () => {
    const inOneHour = new Date(NOW.getTime() + 60 * 60 * 1000).toISOString();
    expect(daysLeftToSchedule(inOneHour, NOW)).toBe(1);
  });

  it('đã quá hạn thì bằng 0', () => {
    expect(daysLeftToSchedule(iso(-2), NOW)).toBe(0);
  });

  it('không có hạn chót thì không có số ngày', () => {
    expect(daysLeftToSchedule(null, NOW)).toBeNull();
  });
});
