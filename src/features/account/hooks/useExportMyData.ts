import { useMutation } from '@tanstack/react-query';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { accountService } from '../services/account.service';
import { AccountDataExportDto } from '../types/account.types';

// yyyymmdd based on local date (matches the BE's suggested file name).
function yyyymmdd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}${m}${day}`;
}

// #AUTH-62: GDPR export — download JSON data then open the share sheet.
export function useExportMyData() {
  return useMutation({
    mutationFn: async () => {
      const res = await accountService.exportMyData();
      const data: AccountDataExportDto | null | undefined = res.data.data;
      // Guard: axios doesn't unwrap — if data is empty, do NOT write the file / show a fake "Downloaded" success (lesson from GH-88).
      if (!data) {
        throw new Error('Did not receive export data from the server.');
      }

      if (!(await Sharing.isAvailableAsync())) {
        throw new Error('This device does not support file sharing.');
      }

      const fileName = `account-export-${data.account.id.replace(/-/g, '')}-${yyyymmdd(new Date())}.json`;
      const file = new File(Paths.cache, fileName);
      if (file.exists) file.delete();
      file.create();
      file.write(JSON.stringify(data, null, 2));

      await Sharing.shareAsync(file.uri, {
        mimeType: 'application/json',
        dialogTitle: 'Account data',
        UTI: 'public.json',
      });
      return fileName;
    },
  });
}
