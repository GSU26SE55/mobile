import { TicketCategoryEnum } from './ticket.enum';

export const KbArticleStatusEnum = {
  Draft: 'Draft',
  PendingReview: 'PendingReview',
  Published: 'Published',
  Archived: 'Archived',
} as const;
export type KbArticleStatusEnum =
  (typeof KbArticleStatusEnum)[keyof typeof KbArticleStatusEnum];

// GH-44 — loại tham chiếu khi gán bài KB vào ticket. BE nhận/trả dạng CHUỖI (không gửi int).
export const KbReferenceTypeEnum = {
  ConsultedDuringResolve: 'ConsultedDuringResolve',
  ProvidedToCustomer: 'ProvidedToCustomer',
  GeneratedAfterResolve: 'GeneratedAfterResolve',
} as const;
export type KbReferenceTypeEnum =
  (typeof KbReferenceTypeEnum)[keyof typeof KbReferenceTypeEnum];

export const KbReferenceTypeLabel: Record<KbReferenceTypeEnum, string> = {
  [KbReferenceTypeEnum.ConsultedDuringResolve]: 'Tham khảo khi xử lý',
  [KbReferenceTypeEnum.ProvidedToCustomer]: 'Cung cấp cho khách hàng',
  [KbReferenceTypeEnum.GeneratedAfterResolve]: 'Tạo sau khi xử lý',
};

export const KbCategoryCode: Record<TicketCategoryEnum, number> = {
  [TicketCategoryEnum.Charging]: 1,
  [TicketCategoryEnum.Overheat]: 2,
  [TicketCategoryEnum.NoPower]: 3,
  [TicketCategoryEnum.Performance]: 4,
  [TicketCategoryEnum.Other]: 5,
  [TicketCategoryEnum.Repair]: 6,
};

export const KbCategoryLabel: Record<TicketCategoryEnum, string> = {
  [TicketCategoryEnum.Charging]: 'Sạc pin',
  [TicketCategoryEnum.Overheat]: 'Quá nhiệt',
  [TicketCategoryEnum.NoPower]: 'Mất điện',
  [TicketCategoryEnum.Performance]: 'Hiệu suất',
  [TicketCategoryEnum.Other]: 'Khác',
  [TicketCategoryEnum.Repair]: 'Sửa chữa',
};

export const KbCategoryIcon: Record<TicketCategoryEnum, string> = {
  [TicketCategoryEnum.Charging]: 'flash-outline',
  [TicketCategoryEnum.Overheat]: 'thermometer-outline',
  [TicketCategoryEnum.NoPower]: 'power-outline',
  [TicketCategoryEnum.Performance]: 'speedometer-outline',
  [TicketCategoryEnum.Other]: 'help-circle-outline',
  [TicketCategoryEnum.Repair]: 'construct-outline',
};

interface KbCategoryOption {
  value: TicketCategoryEnum;
  label: string;
  code: number;
  icon: string;
}

export const KB_CUSTOMER_CATEGORY_OPTIONS: KbCategoryOption[] = (
  Object.keys(TicketCategoryEnum) as (keyof typeof TicketCategoryEnum)[]
).map((key) => {
  const value = TicketCategoryEnum[key];
  return {
    value,
    label: KbCategoryLabel[value],
    code: KbCategoryCode[value],
    icon: KbCategoryIcon[value],
  };
});
