import { Pressable, ScrollView, StyleSheet } from 'react-native';
import { AuthImage } from './AuthImage';

interface Props {
  // BE returns an array of FileId (string[]) — no metadata included.
  fileIds?: string[] | null;
  size?: number;
  // Optional — tap a thumbnail to open the full-screen viewer (passes fileId).
  onPressImage?: (fileId: string) => void;
}

/**
 * Displays attached images (ticket attachment / comment / maintenance) by fileId.
 * Loaded via AuthImage (axios + base64) — do NOT use <Image headers> since iOS/New Arch
 * ignores the request when a custom Authorization header is set.
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
