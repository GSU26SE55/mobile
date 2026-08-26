import { Platform, StyleSheet, TextStyle } from 'react-native';

// ─────────────────────────────────────────────────────────────────────────────
// Solar — the single source of truth for surfaces and neutrals.
// Bright cream ground, solar-energy yellow accent, warm shadows.
// `Colors` below is a projection of this, kept only so the ~150 screens that
// already import `Colors` inherit the palette without being rewritten.
// ─────────────────────────────────────────────────────────────────────────────
export const Solar = {
  bg:          '#FAF6E9', // full-screen bright cream background
  bgDeep:      '#F3ECCF',
  card:        '#FFFDF7', // warm white card — matches the GlassSurface midpoint
  cardPure:    '#FFFFFF',
  cardCream:   '#FFFBEA', // soft warm cream card (performance/chart blocks)
  cardEdge:    '#FFFFFF', // 1.5px highlight edge on every raised surface
  tile:        '#EFECE1', // unfilled cell/segment
  yellow:      '#FFD500', // vivid design-standard energy yellow
  yellowDeep:  '#D9A000', // deep yellow for icon/text on light background
  yellowSoft:  '#FFF6D6', // light yellow pill background
  ink:         '#1C1C1E', // sharp primary text
  ink2:        '#484742',
  mute:        '#7C7C80', // muted secondary text
  faint:       '#C4BFB0',
  border:      '#EFE8D6',
  white:       '#FFFFFF',
  shadow:      '#8C7A4B', // warm cast — never pure black on a cream ground
} as const;

export const Colors = {
  primary:      Solar.yellow,
  primaryDark:  Solar.yellowDeep,
  primaryLight: Solar.yellowSoft,
  accent:       Solar.ink,
  yellow:       Solar.yellow,

  success:      '#34C759',
  successLight: '#E8F8EE',
  successDark:  '#248A3D',
  warning:      '#FF9500',
  warningLight: '#FFF2E5',
  warningDark:  '#B26800',
  danger:       '#FF3B30',
  dangerLight:  '#FFEBE9',
  dangerDark:   '#B22921',
  info:         '#007AFF',
  infoLight:    '#E5F1FF',
  infoDark:     '#0055B3',

  white:        Solar.white,
  bg:           Solar.bg,
  bg2:          Solar.bgDeep,
  card:         Solar.card,
  card2:        Solar.cardCream,
  card3:        Solar.tile,
  gray:         Solar.mute,
  graySoft:     Solar.faint,

  border:       Solar.border,
  borderStrong: '#E2D8BE',
  overlay:      'rgba(20,15,5,0.35)',

  text:         Solar.ink,
  text2:        Solar.ink2,
  textMute:     Solar.mute,
  textFaint:    Solar.faint,

  // Kept for the handful of screens still referencing them.
  textSecondary: Solar.ink2,
  textTertiary:  Solar.mute,
  placeholder:   Solar.faint,
  borderLight:   Solar.border,

  // Ticket status colors — used by charts/timelines, not by badges.
  stProgress:   '#E0A832',
  stWaiting:    '#EF8A28',
  stEscalated:  '#DC4F3D',
} as const;

export const BadgeColors = {
  orange:   { bg: '#FFE5DA', text: '#EF5128' },
  yellow:   { bg: '#FFF1B8', text: '#9C7800' },
  ok:       { bg: '#DCEEDC', text: '#2F7A2F' },
  warn:     { bg: '#FBE6C2', text: '#946011' },
  crit:     { bg: '#FAD9D2', text: '#B73221' },
  p1:       { bg: '#FAD9D2', text: '#B73221' },
  p2:       { bg: '#FBE6C2', text: '#946011' },
  p3:       { bg: '#DCE6F5', text: '#2A538A' },
  new:      { bg: '#F5F2EC', text: '#7A7872' },
  open:     { bg: '#DCE6F5', text: '#2A538A' },
  assigned: { bg: '#D6EDF3', text: '#1E6F84' },
  progress: { bg: '#FBE6C2', text: '#946011' },
  waiting:  { bg: '#FCDFC2', text: '#A55317' },
  resolved: { bg: '#DCEEDC', text: '#2F7A2F' },
  closed:   { bg: '#D2EDE8', text: '#1F6B5F' },
  escalated:{ bg: '#FAD9D2', text: '#B73221' },
} as const;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

// One radius scale. Cards 20, tiles 16, pills 999 — no mixed systems.
export const Radius = {
  xs: 8,
  sm: 10,
  tile: 16,
  md: 16,
  card: 20,
  lg: 24,
  xl: 32,
  full: 9999,
} as const;

// Type scale. Hierarchy comes from size + color, not from stacking weight —
// `900` on every label is what made every screen read the same.
export const Font = {
  display:  { fontSize: 28, fontWeight: '700' as const, letterSpacing: -0.6, color: Solar.ink },
  title:    { fontSize: 18, fontWeight: '700' as const, letterSpacing: -0.3, color: Solar.ink },
  body:     { fontSize: 15, fontWeight: '600' as const, color: Solar.ink },
  bodyMute: { fontSize: 15, fontWeight: '500' as const, color: Solar.mute },
  meta:     { fontSize: 12, fontWeight: '600' as const, color: Solar.mute },
  micro:    {
    fontSize: 11,
    fontWeight: '700' as const,
    letterSpacing: 0.6,
    textTransform: 'uppercase' as const,
  },
} as const;

/** Digits that never change width — required on any live countdown. */
export const numeric: TextStyle = { fontVariant: ['tabular-nums'] };

export const Shadow = Platform.select({
  ios: {
    shadowColor: Solar.shadow,
    shadowOpacity: 0.09,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 6 },
  },
  android: {
    elevation: 3,
  },
  default: {},
}) as object;

export const ShadowSm = Platform.select({
  ios: {
    shadowColor: Solar.shadow,
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  android: {
    elevation: 1,
  },
  default: {},
}) as object;

export const ShadowLg = Platform.select({
  ios: {
    shadowColor: Solar.shadow,
    shadowOpacity: 0.13,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
  },
  android: {
    elevation: 6,
  },
  default: {},
}) as object;

export const ShadowPrimary = Platform.select({
  ios: {
    shadowColor: Solar.yellowDeep,
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  android: {
    elevation: 4,
  },
  default: {},
}) as object;

export const CommonStyles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  screenWhite: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  card: {
    backgroundColor: Colors.card,
    borderRadius: Radius.card,
    borderWidth: 1.5,
    borderColor: Solar.cardEdge,
    padding: 18,
    ...Shadow,
  },
  cardLg: {
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    borderColor: Solar.cardEdge,
    padding: 22,
    ...Shadow,
  },
  input: {
    backgroundColor: Colors.card2,
    borderWidth: 1,
    borderColor: 'transparent',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 13 : 11,
    fontSize: 15,
    color: Colors.text,
  },
  inputFocused: {
    backgroundColor: Colors.card,
    borderColor: Colors.primary,
  },
  inputError: {
    borderColor: Colors.danger,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.textMute,
    marginBottom: 6,
  },
  errorText: {
    fontSize: 12,
    color: Colors.danger,
    marginTop: 4,
  },
  btnPrimary: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    flexDirection: 'row' as const,
    gap: 8,
    ...ShadowPrimary,
  },
  btnPrimaryText: {
    color: Colors.accent,
    fontSize: 15,
    fontWeight: '700' as const,
  },
  btnGhost: {
    backgroundColor: Colors.card2,
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    flexDirection: 'row' as const,
    gap: 8,
  },
  btnGhostText: {
    color: Colors.text,
    fontSize: 15,
    fontWeight: '600' as const,
  },
  btnOutline: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: Colors.primaryDark,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  btnOutlineText: {
    color: Colors.primaryDark,
    fontSize: 15,
    fontWeight: '600' as const,
  },
  btnDisabled: {
    opacity: 0.45,
  },
  btnSm: {
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: 10,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 5,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600' as const,
    lineHeight: 14,
  },
  badgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  fab: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: Colors.card,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    ...Shadow,
  },
  fabSm: {
    width: 36,
    height: 36,
    borderRadius: 11,
    backgroundColor: Colors.card,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    ...Shadow,
  },
  fabAccent: {
    backgroundColor: Colors.primary,
    ...ShadowPrimary,
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
    letterSpacing: -0.3,
  },
  generalError: {
    backgroundColor: Colors.dangerLight,
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: Radius.sm,
    padding: Spacing.md,
    alignItems: 'center' as const,
  },
  generalErrorText: {
    color: Colors.danger,
    fontSize: 14,
    textAlign: 'center' as const,
  },
  center: {
    flex: 1,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  row: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: Spacing.md,
  },
});
