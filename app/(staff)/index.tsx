import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function StaffHomeScreen() {
  return (
    <SafeAreaView style={styles.safe}>
    <View style={styles.container}>
      <Text style={styles.title}>Staff Portal</Text>
      <Text style={styles.subtitle}>Quản lý công việc bảo trì</Text>
    </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:      { flex: 1, backgroundColor: '#fff' },
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  title:     { fontSize: 24, fontWeight: '700', color: '#1a1a1a' },
  subtitle:  { fontSize: 14, color: '#666', marginTop: 8 },
});
