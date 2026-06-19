import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Colors } from '../../../lib/theme';
import { parseSteps } from '../utils/parseSteps';

interface Props {
  text: string;
  variant?: 'numbered' | 'bulleted';
  emphasis?: boolean;
}

export function KbStepList({ text, variant = 'numbered', emphasis }: Props) {
  const steps = useMemo(() => parseSteps(text), [text]);

  if (steps.length === 0) {
    return null;
  }

  if (steps.length === 1) {
    return (
      <Text style={[styles.text, emphasis && styles.textEmphasis]}>
        {steps[0]}
      </Text>
    );
  }

  return (
    <View style={styles.list}>
      {steps.map((step, idx) => (
        <View key={idx} style={styles.row}>
          {variant === 'numbered' ? (
            <View style={styles.bullet}>
              <Text style={styles.bulletText}>{idx + 1}</Text>
            </View>
          ) : (
            <View style={styles.dot} />
          )}
          <Text style={[styles.text, emphasis && styles.textEmphasis, styles.stepText]}>
            {step}
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  bullet: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  bulletText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primaryDark,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.primary,
    marginTop: 8,
  },
  text: {
    fontSize: 14,
    lineHeight: 22,
    color: Colors.text,
  },
  textEmphasis: {
    fontSize: 15,
    lineHeight: 24,
  },
  stepText: {
    flex: 1,
  },
});
