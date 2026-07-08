import { useMutation } from '@tanstack/react-query';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Linking } from 'react-native';
import { BASE_URL } from '../../../lib/axios';
import { ENDPOINTS } from '../../../lib/endpoints';
import { getAccessToken } from '../../../lib/secureStore';
import { ticketChatActionsService } from '../services/ticketChatActions.service';

// GH-68 — tải attachment chat qua virus-scan gate rồi mở share sheet.
// Endpoint download ({attachmentId}=FileId) trả HTTP 200/202/451/404 — validateStatus:()=>true
// nên axios KHÔNG throw; branch status THỦ CÔNG ở đây (KHÔNG dùng handleErrorApi vì 202/451
// là "success-path" của axios). Tải file từ gateway route (như ChatBubble tải ảnh) để chắc
// reachable từ device — response URL của BE có thể là host nội bộ FileStorage.
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

      if (status === 202) throw new Error('File đang được quét virus. Vui lòng thử lại sau.');
      if (status === 451) throw new Error('File bị nhiễm virus, không thể tải.');
      if (status === 404) throw new Error('Không tìm thấy tệp đính kèm.');
      if (status !== 200 || !res.data?.isSuccess) {
        throw new Error(res.data?.message ?? 'Không tải được tệp đính kèm.');
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
