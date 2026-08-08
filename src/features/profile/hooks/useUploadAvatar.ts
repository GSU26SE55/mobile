import * as ImagePicker from 'expo-image-picker';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { QUERY_KEY } from '@/src/lib/queryKeys';
import { fileStorageService } from '@/src/features/file-storage/services/file-storage.service';
import { validateFile } from '@/src/features/file-storage/utils/fileValidation';
import { FilePurposeEnum } from '@/src/features/file-storage/enums/file-storage.enum';
import { profileService } from '../services/profile.service';

export function useUploadAvatar() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) throw new Error('Photo library access permission is required');

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (result.canceled) throw new Error('CANCELLED');

      const asset = result.assets[0];
      const name = asset.fileName ?? `avatar_${Date.now()}.jpg`;
      const type = asset.mimeType ?? 'image/jpeg';

      const check = validateFile(name, asset.fileSize, FilePurposeEnum.Avatar);
      if (!check.valid) throw new Error(check.message ?? 'Invalid file');

      const uploadRes = await fileStorageService.uploadFile({
        uri: asset.uri,
        name,
        type,
        size: asset.fileSize,
        purpose: FilePurposeEnum.Avatar,
      });
      if (!uploadRes.data.isSuccess || !uploadRes.data.data) {
        throw new Error(uploadRes.data.message ?? 'Upload failed');
      }

      await profileService.setAvatar(uploadRes.data.data.fileId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY.profile.me() });
    },
  });
}
