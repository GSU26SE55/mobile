import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link } from 'expo-router';
import { LoginForm } from '../../src/features/auth/components/LoginForm';

export default function LoginScreen() {
  return (
    <SafeAreaView style={styles.flex}>
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Đăng nhập</Text>
        <Text style={styles.subtitle}>Solar Battery Maintenance</Text>

        <LoginForm />

        <Link href="/(auth)/forgot-password" style={styles.link}>
          Quên mật khẩu?
        </Link>

        <View style={styles.registerRow}>
          <Text style={styles.registerText}>Chưa có tài khoản? </Text>
          <Link href="/(auth)/register" style={styles.link}>Đăng ký</Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex:        { flex: 1, backgroundColor: '#fff' },
  container:   { flexGrow: 1, padding: 24, justifyContent: 'center', gap: 16 },
  title:       { fontSize: 28, fontWeight: '700', color: '#1a1a1a' },
  subtitle:    { fontSize: 14, color: '#666', marginBottom: 8 },
  link:        { color: '#2563eb', fontSize: 14 },
  registerRow: { flexDirection: 'row', alignItems: 'center' },
  registerText:{ color: '#555', fontSize: 14 },
});
