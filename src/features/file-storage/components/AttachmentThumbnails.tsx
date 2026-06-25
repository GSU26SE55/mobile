import { Pressable, ScrollView, StyleSheet } from 'react-native';
import { AuthImage } from './AuthImage';

interface Props {
  // BE trả mảng FileId (string[]) — không kèm metadata.
  fileIds?: string[] | null;
  size?: number;
  // Optional — bấm vào thumbnail để mở viewer full-screen (truyền fileId).
  onPressImage?: (fileId: string) => void;
}

/**
 * Hiển thị ảnh đính kèm (ticket attachment / comment / maintenance) theo fileId.
 * Tải qua AuthImage (axios + base64) — KHÔNG dùng <Image headers> vì iOS/New Arch
 * bỏ qua request khi có custom Authorization header.
 */
export function AttachmentThumbnails({ fileIds, size = 72, onPressImage }: Props) {
  if (!fileIds || fileIds.length === 0) return null;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      {fileIds.map((fileId) => (
        <Pressable key={fileId} onPress={onPressImage ? () => onPressImage(fileId) : undefined}>
          <AuthImage
            fileId={fileId}
            style={[styles.img, { width: size, height: size }]}
          />
        </Pressable>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { gap: 8, paddingVertical: 4 },
  img: { borderRadius: 10, backgroundColor: 'rgba(0,0,0,0.05)' },
});
