import { CascadeRiskDto } from "../types/cascade.types";

// Cascade risk UI hidden on FE — component intentionally renders nothing.
export function CascadeRiskBadge({
  data,
}: {
  data: CascadeRiskDto | null | undefined;
}) {
  void data;
  return null;
}
