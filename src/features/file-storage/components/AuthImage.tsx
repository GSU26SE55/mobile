import { useEffect, useState } from 'react';
import { Image, View, Text, ActivityIndicator, StyleSheet, ImageStyle, StyleProp } from 'react-native';
import { axiosInstance } from '@/src/lib/axios';
import { ENDPOINTS } from '@/src/lib/endpoints';
import { Colors } from '@/src/lib/theme';

/**
 * Loads an image that requires auth from FileStorageService, then renders it via a data URI (base64).
 *
 * Do NOT use `<Image source={{ uri, headers }}>`: on iOS/New Architecture (and Expo Go),
 * the native image loader ignores the request when a custom `Authorization` header is set → image fails to load.
 * Instead, load via axios (the interceptor attaches the Bearer token automatically) → base64 → data URI (same as the web AuthImage).
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
            // FileReader.readAsDataURL → base64 data URI (RN-native, no Buffer/btoa needed).
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
        <Text style={styles.fallbackText}>Image error</Text>
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
