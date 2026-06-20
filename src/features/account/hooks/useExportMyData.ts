import { useMutation } from '@tanstack/react-query';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { accountService } from '../services/account.service';
import { AccountDataExportDto } from '../types/account.types';

// yyyymmdd theo local date (khớp tên file BE đề xuất).
function yyyymmdd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}${m}${day}`;
}

// #AUTH-62: GDPR export — tải data JSON rồi mở share sheet.
export function useExportMyData() {
  return useMutation({
    mutationFn: async () => {
      const res = await accountService.exportMyData();
      const data: AccountDataExportDto | null | undefined = res.data.data;
      // Guard: axios không unwrap — nếu data rỗng thì KHÔNG ghi file / báo "Đã tải" giả (bài học GH-88).
      if (!data) {
        throw new Error('Không nhận được dữ liệu export từ máy chủ.');
      }

      if (!(await Sharing.isAvailableAsync())) {
        throw new Error('Thiết bị không hỗ trợ chia sẻ file.');
      }

      const fileName = `account-export-${data.account.id.replace(/-/g, '')}-${yyyymmdd(new Date())}.json`;
      const file = new File(Paths.cache, fileName);
      if (file.exists) file.delete();
      file.create();
      file.write(JSON.stringify(data, null, 2));

      await Sharing.shareAsync(file.uri, {
        mimeType: 'application/json',
        dialogTitle: 'Dữ liệu tài khoản',
        UTI: 'public.json',
      });
      return fileName;
    },
  });
}
