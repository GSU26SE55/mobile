import { useMutation } from '@tanstack/react-query';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Linking } from 'react-native';
import { BASE_URL } from '@/src/lib/axios';
import { ENDPOINTS } from '@/src/lib/endpoints';
import { getAccessToken } from '@/src/lib/secureStore';
import { ticketChatActionsService } from '../services/ticketChatActions.service';

// GH-68 — download a chat attachment through the virus-scan gate then open the share sheet.
// The download endpoint ({attachmentId}=FileId) returns HTTP 200/202/451/404 — validateStatus:()=>true
// so axios does NOT throw; status is branched MANUALLY here (NOT using handleErrorApi because 202/451
// are axios "success-path" statuses). Download the file via the gateway route (like ChatBubble does
// for images) to ensure it's reachable from the device — the BE's response URL may be an internal
// FileStorage host.
export function useDownloadChatAttachment(ticketId: string) {
  return useMutation({
    mutationFn: async ({
      chatId,
      fileId,
      fileName,
    }: {
      chatId: string;
      fileId: string;
      fileName: string;
    }) => {
      const res = await ticketChatActionsService.downloadAttachment(ticketId, chatId, fileId);
      const status = res.status;

      if (status === 202) throw new Error('File is being scanned for viruses. Please try again later.');
      if (status === 451) throw new Error('File is infected with a virus and cannot be downloaded.');
      if (status === 404) throw new Error('Attachment not found.');
      if (status !== 200 || !res.data?.isSuccess) {
        throw new Error(res.data?.message ?? 'Failed to download attachment.');
      }

      const token = await getAccessToken();
      const url = `${BASE_URL}${ENDPOINTS.FILES.DOWNLOAD(fileId)}`;
      const dest = new File(Paths.cache, fileName);
      if (dest.exists) dest.delete();
      const file = await File.downloadFileAsync(url, dest, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(file.uri, { dialogTitle: fileName });
      } else {
        await Linking.openURL(file.uri);
      }
      return fileName;
    },
  });
}
