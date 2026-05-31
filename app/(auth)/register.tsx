import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Link } from 'expo-router';
import { RegisterForm } from '../../src/features/auth/components/RegisterForm';

export default function RegisterScreen() {
  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Đăng ký</Text>
        <Text style={styles.subtitle}>Tạo tài khoản khách hàng</Text>

        <RegisterForm />

        <View style={styles.loginRow}>
          <Text style={styles.loginText}>Đã có tài khoản? </Text>
          <Link href="/(auth)/login" style={styles.link}>Đăng nhập</Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex:      { flex: 1, backgroundColor: '#fff' },
  container: { flexGrow: 1, padding: 24, justifyContent: 'center', gap: 16 },
  title:     { fontSize: 28, fontWeight: '700', color: '#1a1a1a' },
  subtitle:  { fontSize: 14, color: '#666', marginBottom: 8 },
  link:      { color: '#2563eb', fontSize: 14 },
  loginRow:  { flexDirection: 'row', alignItems: 'center' },
  loginText: { color: '#555', fontSize: 14 },
});
