// Keep enum values in sync with the backend — do not change the numbers arbitrarily.
// Other=0 and Uploaded=0 are intentional exceptions to the standard BE convention (enums start at 1):
// Other=0 is the C# default when the upload form doesn't pass a purpose; FileStatusEnum starts at 0 per source.
export const FilePurposeEnum = {
  Other: 0,
  Avatar: 1,
  TicketAttachment: 2,
  MaintenancePhoto: 3,
  KbImage: 4,
  Firmware: 5,
} as const;
export type FilePurposeEnum = (typeof FilePurposeEnum)[keyof typeof FilePurposeEnum];

export const FileStatusEnum = {
  Uploaded: 0,
  Processing: 1,
  Ready: 2,
  Quarantined: 3,
  Deleted: 4,
} as const;
export type FileStatusEnum = (typeof FileStatusEnum)[keyof typeof FileStatusEnum];
