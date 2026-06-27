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
import { Colors } from '../../../lib/theme';
import { useUploadFile } from '../hooks/useUploadFile';
import { AuthImage } from './AuthImage';
import { FilePurposeEnum } from '../enums/file-storage.enum';

// Khớp shape CommentAttachmentPayload (tickets) — required fields từ FileUploadResponse.
export interface UploadedAttachment {
  fileId: string;
  fileName: string;
  contentType: string;
  sizeBytes: number;
}

interface Props {
  /** TicketAttachment(2) cho comment | MaintenancePhoto(3) cho ảnh bảo trì. */
  purpose: FilePurposeEnum;
  value: UploadedAttachment[];
  onChange: (next: UploadedAttachment[]) => void;
  onUploadingChange?: (uploading: boolean) => void;
  max?: number;
  label?: string;
  /** Trigger icon tròn nhỏ (cho thanh chat) thay vì khung dashed 64x64. */
  compact?: boolean;
  /** Ẩn thumbnail trong component này — dùng khi consumer tự hiển thị preview ở nơi khác. */
  hideThumbnails?: boolean;
}

// Mirror getAssetUploadFile của CreateTicketStepper: dựng { uri, name, type, size }.
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
 * Picker ảnh tái dùng: chọn ảnh (camera/thư viện) → upload ngay qua useUploadFile(purpose)
 * → đẩy { fileId, ... } vào `value`. Controlled. Nút X chỉ bỏ khỏi list (file orphan để cleanup job).
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
      Alert.alert('Giới hạn', `Tối đa ${max} ảnh.`);
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
      Alert.alert('Lỗi', `${failed} ảnh tải lên thất bại (sai định dạng hoặc vượt 20MB).`);
    }
  };

  const pickFromCamera = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Quyền truy cập', 'Vui lòng cấp quyền máy ảnh trong cài đặt.');
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
      Alert.alert('Quyền truy cập', 'Vui lòng cấp quyền thư viện ảnh trong cài đặt.');
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
        { options: ['Hủy', 'Chụp ảnh', 'Chọn từ thư viện'], cancelButtonIndex: 0 },
        (idx) => {
          if (idx === 1) pickFromCamera();
          if (idx === 2) pickFromGallery();
        },
      );
    } else {
      Alert.alert('Thêm ảnh', '', [
        { text: 'Hủy', style: 'cancel' },
        { text: 'Chụp ảnh', onPress: pickFromCamera },
        { text: 'Chọn từ thư viện', onPress: pickFromGallery },
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
