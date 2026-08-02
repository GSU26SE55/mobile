import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/src/lib/theme';

// Tài khoản ADMIN/MANAGER không dùng mobile — login bằng các role này (thường/2FA)
// điều hướng về đây thay vì vào app. Đối xứng với web (/use-mobile-app chặn CUSTOMER).
export default function UseWebAppScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <View style={[styles.flex, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={styles.content}>
        <View style={styles.iconCircle}>
          <Ionicons name="desktop-outline" size={34} color={Colors.primary} />
        </View>

        <Text style={styles.title}>Vui lòng sử dụng Web App</Text>
        <Text style={styles.subtitle}>
          Tài khoản Admin và Manager được quản lý trên trình duyệt web. Ứng dụng di
          động dành cho khách hàng và nhân viên (Staff).
        </Text>

        <Pressable
          style={({ pressed }) => [styles.btn, pressed && styles.btnPressed]}
          onPress={() => router.replace('/(auth)/login')}
        >
          <Text style={styles.btnText}>Quay lại đăng nhập</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  iconCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A1A1C',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textMute,
    textAlign: 'center',
    marginTop: 10,
    lineHeight: 20,
  },
  btn: {
    backgroundColor: Colors.primary,
    borderRadius: 28,
    height: 54,
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 32,
  },
  btnPressed: {
    opacity: 0.85,
  },
  btnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
  },
});
