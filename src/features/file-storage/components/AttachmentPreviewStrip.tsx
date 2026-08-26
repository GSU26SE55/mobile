import { Image, Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BASE_URL } from '@/src/lib/axios';
import { ENDPOINTS } from '@/src/lib/endpoints';

interface AttachmentPreviewItem {
  fileId: string;
}

interface AttachmentPreviewStripProps {
  items: AttachmentPreviewItem[];
  onRemove: (fileId: string) => void;
  imageHeaders?: { Authorization: string };
  disabled?: boolean;
}

/** Strip of previews for selected images, shown above the chat bar — only appears when there are images. */
export function AttachmentPreviewStrip({
  items,
  onRemove,
  imageHeaders,
  disabled = false,
}: AttachmentPreviewStripProps) {
  if (items.length === 0) return null;

  return (
    <View style={styles.row}>
      {items.map((att) => (
        <View key={att.fileId} style={styles.thumb}>
          <Image
            source={{ uri: `${BASE_URL}${ENDPOINTS.FILES.DOWNLOAD(att.fileId)}`, headers: imageHeaders }}
            style={styles.img}
          />
          <Pressable
            style={styles.removeBtn}
            onPress={() => onRemove(att.fileId)}
            disabled={disabled}
            hitSlop={6}
          >
            <Ionicons name="close" size={12} color="#fff" />
          </Pressable>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 16, paddingTop: 10 },
  thumb: { position: 'relative' },
  img: { width: 56, height: 56, borderRadius: 10, backgroundColor: 'rgba(0,0,0,0.05)' },
  removeBtn: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 999,
    padding: 2,
  },
});
