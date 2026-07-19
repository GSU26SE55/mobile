import React, { PropsWithChildren } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Polygon } from 'react-native-svg';

type GlassSurfaceProps = PropsWithChildren<{
  style?: StyleProp<ViewStyle>;
  warm?: boolean;
}>;

const hexagons = [
  ['32,25 50,15 68,25 68,46 50,56 32,46', 0.2],
  ['320,72 343,59 366,72 366,98 343,111 320,98', 0.28],
  ['-12,196 20,178 52,196 52,232 20,250 -12,232', 0.22],
  ['305,281 326,269 347,281 347,305 326,317 305,305', 0.18],
  ['46,408 72,393 98,408 98,438 72,453 46,438', 0.19],
  ['333,508 367,489 401,508 401,547 367,566 333,547', 0.2],
  ['-8,644 22,627 52,644 52,679 22,696 -8,679', 0.2],
  ['256,737 276,725 296,737 296,760 276,772 256,760', 0.23],
] as const;

/** Subtle geometric watermark shared by both energy-storage screens. */
export function EnergyBackdrop() {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFillObject}>
      <LinearGradient
        colors={['#FDFBF5', '#FAF6EC', '#F5EFE0']}
        locations={[0, 0.46, 1]}
        style={StyleSheet.absoluteFillObject}
      />
      <View style={styles.glowTop} />
      <View style={styles.glowBottom} />
      <Svg width="100%" height="100%" viewBox="0 0 390 844" style={StyleSheet.absoluteFillObject}>
        {hexagons.map(([points, opacity], index) => (
          <Polygon
            key={points}
            points={points}
            fill="none"
            stroke="#E3D8BA"
            strokeWidth={index % 3 === 0 ? 1.2 : 0.8}
            opacity={opacity}
          />
        ))}
        <Circle cx="348" cy="178" r="68" fill="#FFD500" opacity={0.04} />
        <Circle cx="40" cy="535" r="84" fill="#FFFFFF" opacity={0.35} />
      </Svg>
    </View>
  );
}

/**
 * A translucent, highlighted surface that keeps the liquid-glass treatment
 * consistent without requiring a platform-specific blur dependency.
 */
export function GlassSurface({ children, style, warm = false }: GlassSurfaceProps) {
  return (
    <LinearGradient
      colors={
        warm
          ? ['#FFF2B2', '#FFFDF8']
          : ['rgba(255, 255, 255, 0.98)', 'rgba(255, 252, 244, 0.94)']
      }
      start={{ x: 0.05, y: 0.05 }}
      end={{ x: 0.95, y: 0.95 }}
      style={[styles.glass, style]}
    >
      <View pointerEvents="none" style={styles.glassHighlight} />
      {children}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  glowTop: {
    position: 'absolute',
    width: 240,
    height: 240,
    borderRadius: 120,
    top: -110,
    right: -80,
    backgroundColor: 'rgba(255,213,0,0.07)',
  },
  glowBottom: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    bottom: 80,
    left: -135,
    backgroundColor: 'rgba(255,255,255,0.75)',
  },
  glass: {
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    shadowColor: '#8C7A4B',
    shadowOpacity: 0.09,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
    overflow: 'hidden',
  },
  glassHighlight: {
    position: 'absolute',
    top: 1,
    left: 18,
    right: 18,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.9)',
  },
});
