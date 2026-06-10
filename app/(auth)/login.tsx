import { Ionicons } from '@expo/vector-icons';
import { Link } from 'expo-router';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LoginForm } from '../../src/features/auth/components/LoginForm';
import { Colors, Spacing } from '../../src/lib/theme';

export default function LoginScreen() {
  const insets = useSafeAreaInsets();

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={[styles.container, { paddingTop: insets.top + 40 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.logoBox}>
          <View style={styles.iconCircle}>
            <Ionicons name="sunny" size={36} color={Colors.primary} />
          </View>
          <Text style={styles.brand}>Solar Battery</Text>
          <Text style={styles.subtitle}>Hệ thống quản lý bảo trì pin năng lượng mặt trời</Text>
        </View>

        <View style={styles.formCard}>
          <Text style={styles.title}>Đăng nhập</Text>
          <LoginForm />
        </View>

        <Link href="/(auth)/forgot-password" style={styles.forgotLink}>
          Quên mật khẩu?
        </Link>

        <View style={styles.registerRow}>
          <Text style={styles.registerText}>Chưa có tài khoản? </Text>
          <Link href="/(auth)/register" style={styles.link}>Đăng ký ngay</Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex:         { flex: 1, backgroundColor: Colors.bg },
  container:    { flexGrow: 1, paddingHorizontal: Spacing.xxl, paddingBottom: 40 },
  logoBox:      { alignItems: 'center', marginBottom: 32 },
  iconCircle:   {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 12,
  },
  brand:        { fontSize: 24, fontWeight: '700', color: Colors.primary, letterSpacing: -0.5 },
  subtitle:     { fontSize: 13, color: Colors.textSecondary, textAlign: 'center', marginTop: 4, maxWidth: 260, lineHeight: 18 },
  formCard:     {
    backgroundColor: Colors.white,
    borderRadius: 16, padding: Spacing.xxl,
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 }, elevation: 3,
  },
  title:        { fontSize: 22, fontWeight: '700', color: Colors.text, marginBottom: Spacing.lg },
  forgotLink:   { color: Colors.primary, fontSize: 14, textAlign: 'center', marginTop: Spacing.lg, fontWeight: '500' },
  registerRow:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: Spacing.xl },
  registerText: { color: Colors.textSecondary, fontSize: 14 },
  link:         { color: Colors.primary, fontSize: 14, fontWeight: '600' },
});
