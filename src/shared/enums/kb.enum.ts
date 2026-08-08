import { TicketCategoryEnum } from './ticket.enum';

export const KbArticleStatusEnum = {
  Draft: 'Draft',
  PendingReview: 'PendingReview',
  Published: 'Published',
  Archived: 'Archived',
} as const;
export type KbArticleStatusEnum =
  (typeof KbArticleStatusEnum)[keyof typeof KbArticleStatusEnum];

// GH-44 — reference type when attaching a KB article to a ticket. BE accepts/returns as STRING (do not send int).
export const KbReferenceTypeEnum = {
  ConsultedDuringResolve: 'ConsultedDuringResolve',
  ProvidedToCustomer: 'ProvidedToCustomer',
  GeneratedAfterResolve: 'GeneratedAfterResolve',
} as const;
export type KbReferenceTypeEnum =
  (typeof KbReferenceTypeEnum)[keyof typeof KbReferenceTypeEnum];

export const KbReferenceTypeLabel: Record<KbReferenceTypeEnum, string> = {
  [KbReferenceTypeEnum.ConsultedDuringResolve]: 'Consulted during resolution',
  [KbReferenceTypeEnum.ProvidedToCustomer]: 'Provided to customer',
  [KbReferenceTypeEnum.GeneratedAfterResolve]: 'Generated after resolution',
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
  [TicketCategoryEnum.Charging]: 'Charging',
  [TicketCategoryEnum.Overheat]: 'Overheat',
  [TicketCategoryEnum.NoPower]: 'No Power',
  [TicketCategoryEnum.Performance]: 'Performance',
  [TicketCategoryEnum.Other]: 'Other',
  [TicketCategoryEnum.Repair]: 'Repair',
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
