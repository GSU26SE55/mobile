import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Colors } from '@/src/lib/theme';
import { Skeleton, SkeletonCard } from '@/src/shared/components/motion';

/**
 * Mirrors TicketCard's layout block for block — priority pill, status word, SLA
 * chip, two title lines, divider, meta row. Because the shape matches, the list
 * does not reflow when the real rows land.
 */
function Row() {
  return (
    <SkeletonCard>
      <View style={styles.topRow}>
        <Skeleton width={34} height={22} radius={999} />
        <Skeleton width={58} height={11} />
        <View style={styles.spacer} />
        <Skeleton width={64} height={20} radius={999} />
      </View>

      <Skeleton width="88%" height={14} />
      <Skeleton width="54%" height={14} />

      <View style={styles.footer}>
        <Skeleton width="62%" height={11} />
      </View>
    </SkeletonCard>
  );
}

/** `count` should match what usually fits on screen, so the page looks full. */
export function TicketCardSkeleton({ count = 4 }: { count?: number }) {
  return (
    <View accessibilityLabel="Loading tickets">
      {Array.from({ length: count }, (_, i) => (
        <Row key={i} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  topRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  spacer: { flex: 1 },
  footer: {
    paddingTop: 8,
    marginTop: 2,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
});
