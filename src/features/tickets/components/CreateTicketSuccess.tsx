import React from 'react';
import { StyleSheet, Text, Pressable, View, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, ShadowPrimary } from '@/src/lib/theme';

interface Props {
  ticketCode: string;
  onViewDetails: () => void;
  onBackToList: () => void;
}

export function CreateTicketSuccess({ ticketCode, onViewDetails, onBackToList }: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.iconContainer}>
          <Ionicons name="checkmark-circle" size={80} color="#2E7D32" />
        </View>
        
        <Text style={styles.title}>Ticket Created Successfully</Text>
        <Text style={styles.subtitle}>
          Your support request has been received and is being processed.
        </Text>

        <View style={styles.codeBox}>
          <Text style={styles.codeLabel}>YOUR TICKET CODE</Text>
          <Text style={styles.codeValue}>{ticketCode}</Text>
        </View>
      </View>

      <View style={styles.actions}>
        <Pressable style={[styles.primaryBtn, ShadowPrimary]} onPress={onViewDetails}>
          <Text style={styles.primaryBtnText}>View ticket details</Text>
          <Ionicons name="arrow-forward" size={16} color="#fff" style={{ marginLeft: 6 }} />
        </Pressable>

        <Pressable style={styles.secondaryBtn} onPress={onBackToList}>
          <Text style={styles.secondaryBtnText}>Back to list</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    backgroundColor: Colors.bg,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 16,
      },
      android: {
        elevation: 3,
      },
    }),
    marginBottom: 40,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textMute,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 10,
    marginBottom: 28,
  },
  codeBox: {
    backgroundColor: Colors.card2,
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.04)',
    width: '100%',
  },
  codeLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.textMute,
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  codeValue: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.text,
  },
  actions: {
    gap: 12,
  },
  primaryBtn: {
    backgroundColor: '#EF5128',
    borderRadius: 16,
    paddingVertical: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  secondaryBtn: {
    backgroundColor: 'transparent',
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(0, 0, 0, 0.08)',
  },
  secondaryBtnText: {
    color: Colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
});
