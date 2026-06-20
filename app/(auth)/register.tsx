import { Ionicons } from '@expo/vector-icons';
import { Link } from 'expo-router';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { RegisterForm } from '../../src/features/auth/components/RegisterForm';
import { Colors, Spacing } from '../../src/lib/theme';

export default function RegisterScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={[styles.container, { paddingTop: insets.top + 16 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={Colors.primary} />
          <Text style={styles.backText}>Quay lại</Text>
        </Pressable>

        <View style={styles.header}>
          <View style={styles.iconCircle}>
            <Ionicons name="person-add" size={28} color={Colors.primary} />
          </View>
          <Text style={styles.title}>Tạo tài khoản</Text>
          <Text style={styles.subtitle}>Đăng ký để sử dụng hệ thống</Text>
        </View>

        <View style={styles.formCard}>
          <RegisterForm />
        </View>

        <View style={styles.loginRow}>
          <Text style={styles.loginText}>Đã có tài khoản? </Text>
          <Link href="/(auth)/login" style={styles.link}>Đăng nhập</Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex:       { flex: 1, backgroundColor: Colors.bg },
  container:  { flexGrow: 1, paddingHorizontal: Spacing.xxl, paddingBottom: 40 },
  backBtn:    { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: Spacing.xl, paddingVertical: 4 },
  backText:   { color: Colors.primary, fontSize: 15, fontWeight: '500' },
  header:     { alignItems: 'center', marginBottom: Spacing.xxl },
  iconCircle: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.md,
  },
  title:      { fontSize: 24, fontWeight: '700', color: Colors.text },
  subtitle:   { fontSize: 14, color: Colors.textSecondary, marginTop: 4 },
  formCard:   {
    backgroundColor: Colors.white, borderRadius: 16, padding: Spacing.xxl,
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 }, elevation: 3,
  },
  loginRow:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: Spacing.xl },
  loginText:  { color: Colors.textSecondary, fontSize: 14 },
  link:       { color: Colors.primary, fontSize: 14, fontWeight: '600' },
});
