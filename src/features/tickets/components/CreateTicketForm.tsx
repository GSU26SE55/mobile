import React, { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { createTicketSchema, CreateTicketForm as FormData } from '../schemas/createTicket.schema';
import { TicketCategoryEnum } from '../types/ticket.types';

const CATEGORIES: { value: TicketCategoryEnum; label: string }[] = [
  { value: 'Charging',    label: 'Lỗi sạc' },
  { value: 'Overheat',    label: 'Quá nhiệt' },
  { value: 'NoPower',     label: 'Không có điện' },
  { value: 'Performance', label: 'Hiệu suất kém' },
  { value: 'Repair',      label: 'Yêu cầu sửa chữa' },
  { value: 'Other',       label: 'Khác' },
];

interface Props {
  onSubmit: (data: FormData) => void;
  isLoading?: boolean;
}

export function CreateTicketForm({ onSubmit, isLoading }: Props) {
  const [title, setTitle]             = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory]       = useState<TicketCategoryEnum | ''>('');
  const [errors, setErrors]           = useState<Record<string, string>>({});

  const handleSubmit = () => {
    setErrors({});
    const result = createTicketSchema.safeParse({ title, description, category: category || undefined });
    if (!result.success) {
      const errs: Record<string, string> = {};
      Object.entries(result.error.flatten().fieldErrors).forEach(([k, v]) => {
        if (v?.[0]) errs[k] = v[0];
      });
      setErrors(errs);
      return;
    }
    onSubmit(result.data);
  };

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.field}>
        <Text style={styles.label}>Tiêu đề *</Text>
        <TextInput
          style={[styles.input, errors.title && styles.inputError]}
          value={title}
          onChangeText={setTitle}
          placeholder="Mô tả ngắn vấn đề"
          maxLength={200}
        />
        {errors.title && <Text style={styles.error}>{errors.title}</Text>}
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Mô tả chi tiết *</Text>
        <TextInput
          style={[styles.input, styles.textarea, errors.description && styles.inputError]}
          value={description}
          onChangeText={setDescription}
          placeholder="Mô tả chi tiết vấn đề bạn đang gặp..."
          multiline
          numberOfLines={5}
          maxLength={2000}
        />
        {errors.description && <Text style={styles.error}>{errors.description}</Text>}
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Loại lỗi *</Text>
        <View style={styles.categories}>
          {CATEGORIES.map((c) => (
            <Pressable
              key={c.value}
              style={[styles.chip, category === c.value && styles.chipSelected]}
              onPress={() => setCategory(c.value)}
            >
              <Text style={[styles.chipText, category === c.value && styles.chipTextSelected]}>
                {c.label}
              </Text>
            </Pressable>
          ))}
        </View>
        {errors.category && <Text style={styles.error}>{errors.category}</Text>}
      </View>

      <Pressable style={[styles.btn, isLoading && styles.btnDisabled]} onPress={handleSubmit} disabled={isLoading}>
        {isLoading
          ? <ActivityIndicator color="#fff" />
          : <Text style={styles.btnText}>Gửi yêu cầu</Text>
        }
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container:       { flex: 1 },
  field:           { marginBottom: 16 },
  label:           { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 6 },
  input:           { borderWidth: 1, borderColor: '#DDD', borderRadius: 8, padding: 12, fontSize: 14, backgroundColor: '#FAFAFA' },
  inputError:      { borderColor: '#E53935' },
  textarea:        { height: 120, textAlignVertical: 'top' },
  error:           { color: '#E53935', fontSize: 12, marginTop: 4 },
  categories:      { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip:            { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#DDD', backgroundColor: '#F5F5F5' },
  chipSelected:    { backgroundColor: '#1976D2', borderColor: '#1976D2' },
  chipText:        { fontSize: 13, color: '#444' },
  chipTextSelected:{ color: '#fff', fontWeight: '600' },
  btn:             { backgroundColor: '#1976D2', borderRadius: 10, padding: 14, alignItems: 'center', marginTop: 8 },
  btnDisabled:     { opacity: 0.6 },
  btnText:         { color: '#fff', fontWeight: '700', fontSize: 15 },
});
