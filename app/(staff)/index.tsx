import { View, Text, StyleSheet } from 'react-native';

export default function StaffHomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Staff Portal</Text>
      <Text style={styles.subtitle}>Quản lý công việc bảo trì</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  title:     { fontSize: 24, fontWeight: '700', color: '#1a1a1a' },
  subtitle:  { fontSize: 14, color: '#666', marginTop: 8 },
});
