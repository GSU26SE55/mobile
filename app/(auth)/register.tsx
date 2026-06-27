import { Ionicons } from '@expo/vector-icons';
import { Link, useRouter } from 'expo-router';
import { Alert, Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RegisterForm } from '../../src/features/auth/components/RegisterForm';

export default function RegisterScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const handleGoogleLogin = () => {
    Alert.alert('Đăng nhập Google', 'Chức năng đăng nhập Google đang được kết nối...');
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Back button */}
      <Pressable onPress={() => router.back()} style={[styles.backBtn, { top: insets.top + 16 }]}>
        <Ionicons name="chevron-back" size={20} color="#1A1A1C" />
      </Pressable>

      <ScrollView
        contentContainerStyle={[styles.container, { paddingTop: insets.top + 76, paddingBottom: insets.bottom + 24 }]}
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
          <RegisterForm />
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

        {/* Footer */}
        <View style={styles.loginRow}>
          <Text style={styles.loginText}>Đã có tài khoản? </Text>
          <Link href="/(auth)/login" style={styles.link}>
            Đăng nhập
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  container: {
    flexGrow: 1,
    paddingHorizontal: 28,
  },
  backBtn: {
    position: 'absolute',
    left: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#EBEBEB',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
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

  loginRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    gap: 4,
  },
  loginText: {
    color: '#7A7872',
    fontSize: 14,
  },
  link: {
    color: '#E0533C',
    fontSize: 14,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
});
