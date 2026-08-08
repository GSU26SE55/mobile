import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Colors, Shadow, ShadowPrimary } from '@/src/lib/theme';
import { TicketStatusEnum } from '@/src/features/tickets/types/ticket.types';

interface Props {
  status: TicketStatusEnum;
  onStart?: () => void;
  onHold?: () => void;
  onResume?: () => void;
  onResolve?: () => void;
  onEscalate?: () => void;
  isLoading?: boolean;
  canResolve?: boolean; // GH-47 — gate the Resolve button on ticket.resolve
}

export function TicketActionBar({ status, onStart, onHold, onResume, onResolve, onEscalate, isLoading, canResolve = true }: Props) {
  if (isLoading) {
    return (
      <View style={[styles.bar, Shadow]}>
        <ActivityIndicator color={Colors.primary} />
      </View>
    );
  }

  if (status === 'Assigned') {
    return (
      <View style={[styles.bar, Shadow]}>
        <Pressable style={[styles.btnPrimary, ShadowPrimary, { flex: 1 }]} onPress={onStart}>
          <Ionicons name="play" size={16} color={Colors.text} />
          <Text style={styles.btnPrimaryText}>Start processing</Text>
        </Pressable>
      </View>
    );
  }

  if (status === 'InProgress') {
    return (
      <View style={[styles.bar, Shadow]}>
        <Pressable style={styles.btnOutline} onPress={onHold}>
          <Ionicons name="pause-outline" size={16} color={Colors.warning} />
          <Text style={[styles.btnOutlineText, { color: Colors.warning }]}>Hold</Text>
        </Pressable>
        {canResolve && (
          // Green + white text: the "successfully completed" action, clearly distinct
          // from yellow (in progress) / orange (on hold) / red (escalate) beside it.
          <Pressable style={[styles.btnSuccess, { flex: 1 }]} onPress={onResolve}>
            <Ionicons name="checkmark-circle" size={16} color="#fff" />
            <Text style={styles.btnSuccessText}>Resolve</Text>
          </Pressable>
        )}
        <Pressable style={styles.btnDanger} onPress={onEscalate}>
          <Ionicons name="arrow-up-circle-outline" size={16} color={Colors.danger} />
          <Text style={[styles.btnOutlineText, { color: Colors.danger }]}>Escalate</Text>
        </Pressable>
      </View>
    );
  }

  if (['WaitingCustomer', 'WaitingParts', 'WaitingOnsiteSchedule'].includes(status)) {
    return (
      <View style={[styles.bar, Shadow]}>
        <Pressable style={[styles.btnPrimary, ShadowPrimary, { flex: 1 }]} onPress={onResume}>
          <Ionicons name="play" size={16} color="#fff" />
          <Text style={styles.btnPrimaryText}>Resume processing</Text>
        </Pressable>
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.03)',
  },
  btnPrimary: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  btnPrimaryText: {
    // Primary background is YELLOW (#FFD500) — white text on it is nearly unreadable.
    // Use dark ink for contrast, don't switch this back to '#fff'.
    color: Colors.text,
    fontSize: 13,
    fontWeight: '800',
  },
  btnSuccess: {
    backgroundColor: Colors.success,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  btnSuccessText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '800',
  },
  btnOutline: {
    borderWidth: 1.5,
    borderColor: Colors.warning,
    borderRadius: 14,
    paddingVertical: 11,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  btnDanger: {
    borderWidth: 1.5,
    borderColor: Colors.danger,
    borderRadius: 14,
    paddingVertical: 11,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  btnOutlineText: {
    fontSize: 12,
    fontWeight: '700',
  },
});
