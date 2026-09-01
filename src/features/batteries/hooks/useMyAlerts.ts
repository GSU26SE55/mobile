import { useQuery } from "@tanstack/react-query";
import { QUERY_KEY } from "@/src/lib/queryKeys";
import { alertService } from "../services/alert.service";
import { AlertDto, AlertListParams } from "../types/alert.types";

// Customer's alerts. GET /api/alerts is already customer-scoped server-side when the caller's JWT
// is a Customer (GetAlertsQueryHandler → scope.IsCustomerScoped), covering both battery-level and
// site-level alerts in one call — no need to fan out per batteryAssetId.
export function useMyAlerts(params?: AlertListParams) {
  const merged: AlertListParams = { pageSize: 100, ...params };
  return useQuery({
    queryKey: QUERY_KEY.alerts.list({ mine: true, ...merged } as Record<
      string,
      unknown
    >),
    queryFn: async () => {
      const res = await alertService.getList(merged);
      const items = res.data.data?.items ?? [];
      return items.sort(
        (a, b) =>
          new Date(b.detectedAt).getTime() - new Date(a.detectedAt).getTime(),
      ) as AlertDto[];
    },
  });
}
