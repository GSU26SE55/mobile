import React, { useState } from 'react';
import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { rateTicketSchema } from '../schemas/rateTicket.schema';
import { RatePayload } from '../types/ticket.types';

interface Props {
  visible: boolean;
  isLoading?: boolean;
  onClose: () => void;
  onSubmit: (data: RatePayload) => void;
}

export function RateModal({ visible, isLoading, onClose, onSubmit }: Props) {
  const [rating, setRating]           = useState(0);
  const [comment, setComment]         = useState('');
  const [ratingError, setRatingError] = useState('');

  const handleSubmit = () => {
    setRatingError('');
    const result = rateTicketSchema.safeParse({ rating, ratingComment: comment || undefined });
    if (!result.success) {
      const err = result.error.flatten().fieldErrors;
      if (err.rating?.[0]) setRatingError(err.rating[0]);
      return;
    }
    onSubmit(result.data);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <Text style={styles.title}>Đánh giá dịch vụ</Text>

          <View style={styles.stars}>
            {[1, 2, 3, 4, 5].map((s) => (
              <Pressable key={s} onPress={() => setRating(s)}>
                <Text style={[styles.star, s <= rating && styles.starActive]}>★</Text>
              </Pressable>
            ))}
          </View>
          {ratingError ? <Text style={styles.error}>{ratingError}</Text> : null}

          <TextInput
            style={styles.input}
            value={comment}
            onChangeText={setComment}
            placeholder="Nhận xét (tuỳ chọn)"
            multiline
            numberOfLines={3}
            maxLength={500}
          />

          <View style={styles.actions}>
            <Pressable style={styles.cancel} onPress={onClose}>
              <Text style={styles.cancelText}>Huỷ</Text>
            </Pressable>
            <Pressable style={[styles.submit, isLoading && styles.btnDisabled]} onPress={handleSubmit} disabled={isLoading}>
              {isLoading
                ? <ActivityIndicator color="#fff" size="small" />
                : <Text style={styles.submitText}>Gửi đánh giá</Text>
              }
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay:    { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet:      { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, gap: 16 },
  title:      { fontSize: 18, fontWeight: '700', textAlign: 'center', color: '#111' },
  stars:      { flexDirection: 'row', justifyContent: 'center', gap: 8 },
  star:       { fontSize: 36, color: '#E0E0E0' },
  starActive: { color: '#FBC02D' },
  error:      { color: '#E53935', fontSize: 12, textAlign: 'center' },
  input:      { borderWidth: 1, borderColor: '#DDD', borderRadius: 8, padding: 12, fontSize: 14, textAlignVertical: 'top', minHeight: 80 },
  actions:    { flexDirection: 'row', gap: 12 },
  cancel:     { flex: 1, padding: 13, borderRadius: 10, borderWidth: 1, borderColor: '#DDD', alignItems: 'center' },
  cancelText: { fontSize: 14, color: '#555' },
  submit:     { flex: 1, padding: 13, borderRadius: 10, backgroundColor: '#1976D2', alignItems: 'center' },
  btnDisabled:{ opacity: 0.6 },
  submitText: { fontSize: 14, fontWeight: '700', color: '#fff' },
});
