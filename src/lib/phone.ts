// BE stores phone in E.164 (+84xxxxxxxxx) to dedupe consistently; forms/schemas only
// accept the local 0xxxxxxxxx shape, so convert back when prefilling for edit.
export function toLocalPhone(phone?: string | null): string {
  return phone?.replace(/^\+84/, '0') ?? '';
}
