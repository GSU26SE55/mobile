import { router } from 'expo-router';
import React from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CreateTicketForm } from '../../../src/features/tickets/components/CreateTicketForm';
import { useCreateTicket } from '../../../src/features/tickets/hooks/useCreateTicket';
import { CreateTicketForm as FormData } from '../../../src/features/tickets/schemas/createTicket.schema';

export default function CreateTicketScreen() {
  const { mutateAsync, isPending } = useCreateTicket();

  const handleSubmit = async (data: FormData) => {
    try {
      await mutateAsync(data);
      router.back();
    } catch {
      Alert.alert('Lỗi', 'Không thể tạo ticket. Vui lòng thử lại.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.inner}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backText}>‹ Quay lại</Text>
          </Pressable>
          <Text style={styles.title}>Tạo yêu cầu hỗ trợ</Text>
          <View style={{ width: 80 }} />
        </View>
        <CreateTicketForm onSubmit={handleSubmit} isLoading={isPending} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  inner:     { flex: 1, padding: 16 },
  header:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  backBtn:   { width: 80 },
  backText:  { color: '#1976D2', fontSize: 15, fontWeight: '600' },
  title:     { fontSize: 18, fontWeight: '700', color: '#111' },
});
