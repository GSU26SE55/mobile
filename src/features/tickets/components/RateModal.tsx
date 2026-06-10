import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Colors, Shadow, ShadowPrimary } from '../../../lib/theme';
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
          <View style={styles.handle} />
          <View style={styles.headerRow}>
            <Text style={styles.title}>Danh gia xu ly</Text>
            <Pressable style={styles.closeBtn} onPress={onClose}>
              <Ionicons name="close" size={16} color={Colors.text2} />
            </Pressable>
          </View>

          <View style={styles.stars}>
            {[1, 2, 3, 4, 5].map((s) => (
              <Pressable key={s} onPress={() => setRating(s)}>
                <Ionicons
                  name={s <= rating ? 'star' : 'star-outline'}
                  size={40}
                  color={s <= rating ? Colors.primary : Colors.card3}
                />
              </Pressable>
            ))}
          </View>
          {ratingError ? <Text style={styles.error}>{ratingError}</Text> : null}

          <Text style={styles.inputLabel}>Nhan xet (khong bat buoc)</Text>
          <TextInput
            style={styles.input}
            value={comment}
            onChangeText={setComment}
            placeholder="KTV xu ly nhanh chong..."
            placeholderTextColor={Colors.textFaint}
            multiline
            numberOfLines={4}
            maxLength={500}
          />

          <Pressable
            style={[styles.submitBtn, (!rating || isLoading) && styles.btnDisabled]}
            onPress={handleSubmit}
            disabled={!rating || isLoading}
          >
            {isLoading
              ? <ActivityIndicator color="#fff" size="small" />
              : <Text style={styles.submitText}>Gui danh gia & dong</Text>
            }
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay:    { flex: 1, backgroundColor: Colors.overlay, justifyContent: 'flex-end' },
  sheet:      {
    backgroundColor: Colors.card,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingHorizontal: 18, paddingBottom: 22,
    gap: 14,
  },
  handle:     {
    width: 36, height: 4, borderRadius: 2,
    backgroundColor: Colors.card3, alignSelf: 'center',
    marginTop: 8, marginBottom: 4,
  },
  headerRow:  { flexDirection: 'row', alignItems: 'center' },
  title:      { flex: 1, fontSize: 17, fontWeight: '700', color: Colors.text },
  closeBtn:   {
    width: 36, height: 36, borderRadius: 11,
    backgroundColor: Colors.card, ...Shadow,
    alignItems: 'center', justifyContent: 'center',
  },
  stars:      { flexDirection: 'row', justifyContent: 'center', gap: 10 },
  error:      { color: Colors.danger, fontSize: 12, textAlign: 'center' },
  inputLabel: { fontSize: 12, fontWeight: '500', color: Colors.textMute },
  input:      {
    backgroundColor: Colors.card2,
    borderRadius: 12, padding: 13,
    fontSize: 14, color: Colors.text,
    textAlignVertical: 'top', minHeight: 80,
  },
  submitBtn:  {
    backgroundColor: Colors.primary, borderRadius: 14,
    padding: 13, alignItems: 'center',
    ...ShadowPrimary,
  },
  btnDisabled:{ opacity: 0.45 },
  submitText: { fontSize: 14, fontWeight: '600', color: '#fff' },
});
