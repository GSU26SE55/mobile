import { useQuery } from '@tanstack/react-query';
import { QUERY_KEY } from '@/src/lib/queryKeys';
import { HttpError } from '@/src/lib/errors';
import { batteryTypeService } from '../services/battery-type.service';

/**
 * Ngưỡng cảnh báo hiện hành của 1 loại pin.
 *
 * BE trả 404 khi loại pin chưa được Admin cấu hình ngưỡng — đó là trạng thái
 * hợp lệ chứ không phải lỗi, nên nuốt 404 thành `null` để UI hiện "chưa cấu
 * hình" thay vì bắn toast đỏ. Các lỗi khác (403/500) vẫn ném ra như thường.
 */
export function useThresholdByType(batteryTypeId: string) {
  return useQuery({
    queryKey: QUERY_KEY.batteryTypes.threshold(batteryTypeId),
    queryFn: () =>
      batteryTypeService
        .getThresholdByType(batteryTypeId)
        .then((r) => r.data.data ?? null)
        .catch((err) => {
          if (err instanceof HttpError && err.statusCode === 404) return null;
          throw err;
        }),
    enabled: !!batteryTypeId,
    staleTime: 10 * 60 * 1000, // ngưỡng hiếm khi đổi — cache lâu như battery config
  });
}
