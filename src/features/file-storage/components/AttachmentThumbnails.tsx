import { Image, ScrollView, StyleSheet } from 'react-native';
import { useAuthImageHeaders } from '../hooks/useAuthImageHeaders';
import { BASE_URL } from '../../../lib/axios';
import { ENDPOINTS } from '../../../lib/endpoints';

interface Props {
  // BE trả mảng FileId (string[]) — không kèm metadata.
  fileIds?: string[] | null;
  size?: number;
}

/**
 * Hiển thị ảnh đính kèm (ticket attachment / comment / maintenance) theo fileId.
 * Ảnh tải qua GET /api/files/{id}/download — endpoint CẦN auth, nên gắn Bearer thủ công
 * qua `useAuthImageHeaders` (RN <Image> không tự gửi token).
 */
export function AttachmentThumbnails({ fileIds, size = 72 }: Props) {
  const headers = useAuthImageHeaders();

  if (!fileIds || fileIds.length === 0) return null;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      {fileIds.map((fileId) => (
        <Image
          key={fileId}
          source={{ uri: `${BASE_URL}${ENDPOINTS.FILES.DOWNLOAD(fileId)}`, headers }}
          style={[styles.img, { width: size, height: size }]}
        />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { gap: 8, paddingVertical: 4 },
  img: { borderRadius: 10, backgroundColor: 'rgba(0,0,0,0.05)' },
});
