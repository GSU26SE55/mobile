import { useEffect, useState } from 'react';
import { Image, View, Text, ActivityIndicator, StyleSheet, ImageStyle, StyleProp } from 'react-native';
import { axiosInstance } from '../../../lib/axios';
import { ENDPOINTS } from '../../../lib/endpoints';
import { Colors } from '../../../lib/theme';

/**
 * Tải ảnh cần auth từ FileStorageService rồi hiển thị qua data URI (base64).
 *
 * KHÔNG dùng `<Image source={{ uri, headers }}>`: trên iOS/New Architecture (và Expo Go),
 * native image loader bỏ qua request khi có custom `Authorization` header → ảnh không tải.
 * Thay vào đó tải bằng axios (interceptor tự gắn Bearer) → base64 → data URI (giống web AuthImage).
 */
export function AuthImage({
  fileId,
  style,
  resizeMode = 'cover',
}: {
  fileId: string;
  style?: StyleProp<ImageStyle>;
  resizeMode?: 'cover' | 'contain';
}) {
  const [state, setState] = useState<{ uri: string | null; error: boolean }>({
    uri: null,
    error: false,
  });

  useEffect(() => {
    let active = true;
    setState({ uri: null, error: false });

    axiosInstance
      .get(ENDPOINTS.FILES.DOWNLOAD(fileId), { responseType: 'blob' })
      .then(
        (res) =>
          new Promise<string>((resolve, reject) => {
            // FileReader.readAsDataURL → data URI base64 (RN-native, không cần Buffer/btoa).
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(res.data as Blob);
          }),
      )
      .then((dataUri) => {
        if (active) setState({ uri: dataUri, error: false });
      })
      .catch(() => {
        if (active) setState({ uri: null, error: true });
      });

    return () => {
      active = false;
    };
  }, [fileId]);

  if (state.error) {
    return (
      <View style={[styles.fallback, style]}>
        <Text style={styles.fallbackText}>Lỗi ảnh</Text>
      </View>
    );
  }

  if (!state.uri) {
    return (
      <View style={[styles.fallback, style]}>
        <ActivityIndicator size="small" color={Colors.primary} />
      </View>
    );
  }

  return <Image source={{ uri: state.uri }} style={style} resizeMode={resizeMode} />;
}

const styles = StyleSheet.create({
  fallback: {
    backgroundColor: Colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fallbackText: {
    fontSize: 10,
    color: Colors.gray,
  },
});
