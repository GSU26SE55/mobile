import * as ImagePicker from 'expo-image-picker';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { QUERY_KEY } from '../../../lib/queryKeys';
import { fileStorageLib } from '../../../lib/fileStorage';
import { profileService } from '../services/profile.service';

export function useUploadAvatar() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) throw new Error('Cần quyền truy cập thư viện ảnh');

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

      const uploadRes = await fileStorageLib.uploadAvatar(asset.uri, name, type);
      if (!uploadRes.data.isSuccess || !uploadRes.data.data) {
        throw new Error(uploadRes.data.message ?? 'Upload thất bại');
      }

      await profileService.setAvatar(uploadRes.data.data.fileId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY.profile.me() });
    },
  });
}
