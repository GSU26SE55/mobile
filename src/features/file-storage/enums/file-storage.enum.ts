// Giữ enum value đồng bộ với backend — không tự ý đổi số.
// Other=0 và Uploaded=0 là ngoại lệ có chủ ý so với quy tắc BE chuẩn (enum bắt đầu từ 1):
// Other=0 là default C# khi form upload không truyền purpose; FileStatusEnum bắt đầu từ 0 theo source.
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
