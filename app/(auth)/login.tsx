import { Ionicons } from '@expo/vector-icons';
import { Link, useRouter } from 'expo-router';
import { Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View, Pressable, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LoginForm } from '../../src/features/auth/components/LoginForm';
import { Colors } from '../../src/lib/theme';

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const handleGoogleLogin = () => {
    Alert.alert('Đăng nhập Google', 'Chức năng đăng nhập Google đang được kết nối...');
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={[styles.container, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Logo */}
        <View style={styles.logoSection}>
          <Image
            source={require('../../assets/images/logo.png')}
            style={styles.logoImage}
          />
          <Text style={styles.brand}>Solar Battery</Text>
        </View>

        {/* Form */}
        <View style={styles.formSection}>
          <LoginForm />
        </View>

        {/* OAuth - Google only */}
        <View style={styles.oauthSection}>
          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>Hoặc tiếp tục bằng</Text>
            <View style={styles.dividerLine} />
          </View>

          <Pressable style={styles.googleBtn} onPress={handleGoogleLogin}>
            <Image
              source={require('../../assets/images/google.png')}
              style={styles.googleIconImage}
            />
            <Text style={styles.googleBtnText}>Tiếp tục bằng Google</Text>
          </Pressable>
        </View>

        {/* Footer links */}
        <View style={styles.footer}>
          <View style={styles.registerRow}>
            <Text style={styles.registerText}>Chưa có tài khoản? </Text>
            <Link href="/(auth)/register" style={styles.registerLink}>
              Đăng ký ngay
            </Link>
          </View>

          <Link href="/(auth)/reactivate" style={styles.reactivateLink}>
            Khôi phục tài khoản đã xóa
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  container: {
    flexGrow: 1,
    paddingHorizontal: 28,
    justifyContent: 'center',
  },

  logoSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logoImage: {
    width: 72,
    height: 72,
    marginBottom: 8,
  },
  brand: {
    fontSize: 26,
    fontWeight: '800',
    color: '#1A1A1C',
    letterSpacing: -0.5,
  },

  oauthSection: {
    marginBottom: 24,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 8,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#EBEBEB',
  },
  dividerText: {
    marginHorizontal: 12,
    color: '#7A7872',
    fontSize: 13,
    fontWeight: '500',
  },
  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EBEBEB',
    borderRadius: 28,
    height: 54,
    width: '100%',
  },
  googleIconImage: {
    width: 20,
    height: 20,
    marginRight: 10,
  },
  googleBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1A1A1C',
  },

  formSection: {
    marginBottom: 24,
  },

  footer: {
    alignItems: 'center',
    marginTop: 12,
    gap: 16,
  },
  registerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  registerText: {
    fontSize: 14,
    color: '#7A7872',
  },
  registerLink: {
    fontSize: 14,
    color: '#E0533C',
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  reactivateLink: {
    fontSize: 13,
    color: '#B0AEA6',
    fontWeight: '500',
  },
});
