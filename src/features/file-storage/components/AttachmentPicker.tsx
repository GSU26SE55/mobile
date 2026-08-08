import { useState } from 'react';
import {
  ActionSheetIOS,
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/src/lib/theme';
import { useUploadFile } from '../hooks/useUploadFile';
import { AuthImage } from './AuthImage';
import { FilePurposeEnum } from '../enums/file-storage.enum';

// Matches the CommentAttachmentPayload shape (tickets) — required fields from FileUploadResponse.
export interface UploadedAttachment {
  fileId: string;
  fileName: string;
  contentType: string;
  sizeBytes: number;
}

interface Props {
  /** TicketAttachment(2) for comments | MaintenancePhoto(3) for maintenance photos. */
  purpose: FilePurposeEnum;
  value: UploadedAttachment[];
  onChange: (next: UploadedAttachment[]) => void;
  onUploadingChange?: (uploading: boolean) => void;
  max?: number;
  label?: string;
  /** Small round trigger icon (for the chat bar) instead of the 64x64 dashed box. */
  compact?: boolean;
  /** Hide thumbnails in this component — used when the consumer renders its own preview elsewhere. */
  hideThumbnails?: boolean;
}

// Mirrors getAssetUploadFile from CreateTicketStepper: builds { uri, name, type, size }.
const assetToFile = (asset: ImagePicker.ImagePickerAsset) => {
  const uriName = asset.uri.split('/').pop();
  const assetName = asset.fileName ?? uriName;
  const rawExt = assetName?.split('.').pop()?.toLowerCase();
  const type = rawExt === 'png' || asset.mimeType === 'image/png' ? 'image/png' : 'image/jpeg';
  const fallbackExt = type === 'image/png' ? 'png' : 'jpg';
  const allowed = rawExt === 'jpg' || rawExt === 'jpeg' || rawExt === 'png';
  const name = allowed && assetName ? assetName : `attachment-${Date.now()}.${fallbackExt}`;
  return { uri: asset.uri, name, type, size: asset.fileSize };
};

/**
 * Reusable image picker: pick an image (camera/library) → upload immediately via useUploadFile(purpose)
 * → push { fileId, ... } into `value`. Controlled. The X button only removes it from the list (file is left orphaned for the cleanup job).
 */
export function AttachmentPicker({
  purpose,
  value,
  onChange,
  onUploadingChange,
  max = 5,
  label,
  compact = false,
  hideThumbnails = false,
}: Props) {
  const { mutateAsync } = useUploadFile();
  const [uploading, setUploading] = useState(false);

  const items = value ?? [];
  const remaining = max - items.length;

  const setBusy = (b: boolean) => {
    setUploading(b);
    onUploadingChange?.(b);
  };

  const uploadAssets = async (assets: ImagePicker.ImagePickerAsset[]) => {
    const accepted = assets.slice(0, Math.max(0, remaining));
    if (assets.length > accepted.length) {
      Alert.alert('Limit reached', `Maximum ${max} photos.`);
    }
    if (accepted.length === 0) return;

    setBusy(true);
    let current = [...items];
    let failed = 0;
    for (const asset of accepted) {
      try {
        const file = assetToFile(asset);
        const data = await mutateAsync({ ...file, purpose });
        current = [
          ...current,
          {
            fileId: data.fileId,
            fileName: data.fileName,
            contentType: data.contentType,
            sizeBytes: data.size,
          },
        ];
        onChange(current);
      } catch {
        failed += 1;
      }
    }
    setBusy(false);
    if (failed > 0) {
      Alert.alert('Error', `${failed} photo(s) failed to upload (invalid format or over 20MB).`);
    }
  };

  const pickFromCamera = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission required', 'Please grant camera permission in settings.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
    });
    if (!result.canceled && result.assets?.[0]) await uploadAssets([result.assets[0]]);
  };

  const pickFromGallery = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission required', 'Please grant photo library permission in settings.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.7,
    });
    if (!result.canceled && result.assets) await uploadAssets(result.assets);
  };

  const handleAdd = () => {
    if (uploading || remaining <= 0) return;
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        { options: ['Cancel', 'Take Photo', 'Choose from Library'], cancelButtonIndex: 0 },
        (idx) => {
          if (idx === 1) pickFromCamera();
          if (idx === 2) pickFromGallery();
        },
      );
    } else {
      Alert.alert('Add Photo', '', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Take Photo', onPress: pickFromCamera },
        { text: 'Choose from Library', onPress: pickFromGallery },
      ]);
    }
  };

  const handleRemove = (fileId: string) =>
    onChange(items.filter((a) => a.fileId !== fileId));

  if (compact) {
    return (
      <Pressable
        style={styles.addBtnCompact}
        onPress={handleAdd}
        disabled={uploading || remaining <= 0}
      >
        {uploading ? (
          <ActivityIndicator size="small" color={Colors.textMute} />
        ) : (
          <Ionicons name="camera-outline" size={18} color={Colors.textMute} />
        )}
      </Pressable>
    );
  }

  return (
    <View style={styles.wrap}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {!hideThumbnails &&
          items.map((att) => (
            <View key={att.fileId} style={styles.thumb}>
              <AuthImage fileId={att.fileId} style={styles.img} />
              <Pressable style={styles.removeBtn} onPress={() => handleRemove(att.fileId)} hitSlop={6}>
                <Ionicons name="close" size={12} color="#fff" />
              </Pressable>
            </View>
          ))}

        {remaining > 0 && (
          <Pressable style={styles.addBtn} onPress={handleAdd} disabled={uploading}>
            {uploading ? (
              <ActivityIndicator size="small" color={Colors.textMute} />
            ) : (
              <Ionicons name="camera-outline" size={22} color={Colors.textMute} />
            )}
          </Pressable>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 6 },
  label: { fontSize: 12, fontWeight: '600', color: Colors.textMute },
  row: { gap: 8, paddingVertical: 4 },
  thumb: { position: 'relative' },
  img: { width: 64, height: 64, borderRadius: 10, backgroundColor: 'rgba(0,0,0,0.05)' },
  removeBtn: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 999,
    padding: 2,
  },
  addBtn: {
    width: 64,
    height: 64,
    borderRadius: 10,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtnCompact: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
