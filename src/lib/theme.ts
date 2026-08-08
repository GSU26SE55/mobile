import { Platform, StyleSheet } from 'react-native';

export const Colors = {
  primary:      '#FFD500',
  primaryDark:  '#D9A000',
  primaryLight: '#FFF6D6',
  primaryGlow:  'rgba(255, 213, 0, 0.22)',
  accent:       '#1C1C1E',
  yellow:       '#FFD500',
  yellowSoft:   '#FFF6D6',
  yellowDark:   '#D9A000',

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

  white:        '#FFFFFF',
  bg:           '#FAF6E9',
  bg2:          '#F4EEDC',
  card:         '#FFFFFF',
  card2:        '#F7F3E6',
  card3:        '#EFE8D6',
  gray:         '#8E8E93',
  graySoft:     '#C7C7CC',

  border:       'rgba(235,230,215,0.7)',
  borderStrong: 'rgba(215,205,180,0.8)',
  overlay:      'rgba(20,15,5,0.35)',

  text:         '#1C1C1E',
  text2:        '#3A3A3C',
  textMute:     '#7C7C80',
  textFaint:    '#C4BFB0',

  // Legacy aliases
  textSecondary:'#45464A',
  textTertiary: '#7A7872',
  placeholder:  '#B0AEA6',
  inputBg:      '#F5F2EC',
  borderLight:  '#E6E2DB',
  tabBar:       '#1A1A1C',
  tabBarInactive:'#7A7872',

  // Ticket status colors
  stNew:        '#8E8B85',
  stOpen:       '#5081C7',
  stAssigned:   '#4FAFC7',
  stProgress:   '#E0A832',
  stWaiting:    '#EF8A28',
  stResolved:   '#5BA85B',
  stClosed:     '#3FA496',
  stEscalated:  '#DC4F3D',
} as const;

// "Solar" palette — taken from the standard design (bright cream background, solar-energy yellow accent).
export const Solar = {
  bg:          '#FAF6E9', // full-screen bright cream background
  bgDeep:      '#F3ECCF',
  card:        '#FFFFFF', // pure white card
  cardCream:   '#FFFBEA', // soft warm cream card (performance/chart blocks)
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

export const Radius = {
  xs: 8,
  sm: 10,
  md: 16,
  lg: 24,
  xl: 32,
  full: 9999,
} as const;

export const Font = {
  h1:       { fontSize: 28, fontWeight: '700' as const, color: Colors.text, letterSpacing: -0.5 },
  h2:       { fontSize: 22, fontWeight: '700' as const, color: Colors.text, letterSpacing: -0.3 },
  h3:       { fontSize: 18, fontWeight: '700' as const, color: Colors.text },
  body:     { fontSize: 14, fontWeight: '400' as const, color: Colors.text, lineHeight: 20 },
  bodyBold: { fontSize: 14, fontWeight: '600' as const, color: Colors.text },
  caption:  { fontSize: 13, fontWeight: '400' as const, color: Colors.textMute },
  small:    { fontSize: 12, fontWeight: '400' as const, color: Colors.textMute },
  eyebrow:  { fontSize: 11, fontWeight: '600' as const, color: Colors.textMute, letterSpacing: 0.5 },
  display:  { fontSize: 32, fontWeight: '600' as const, color: Colors.text, letterSpacing: -0.5 },
  stat:     { fontSize: 32, fontWeight: '700' as const, color: Colors.text },
  section:  { fontSize: 17, fontWeight: '600' as const, color: Colors.text, letterSpacing: -0.3 },
} as const;

export const Shadow = Platform.select({
  ios: {
    shadowColor: '#000000',
    shadowOpacity: 0.03,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 6 },
  },
  android: {
    elevation: 2,
  },
  default: {},
}) as object;

export const ShadowSm = Platform.select({
  ios: {
    shadowColor: '#000000',
    shadowOpacity: 0.015,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  android: {
    elevation: 1,
  },
  default: {},
}) as object;

export const ShadowLg = Platform.select({
  ios: {
    shadowColor: '#000000',
    shadowOpacity: 0.05,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
  },
  android: {
    elevation: 4,
  },
  default: {},
}) as object;

export const ShadowPrimary = Platform.select({
  ios: {
    shadowColor: '#34C759',
    shadowOpacity: 0.25,
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
    borderRadius: Radius.md,
    padding: 18,
    ...Shadow,
  },
  cardLg: {
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
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
    fontSize: 14,
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
    fontWeight: '500' as const,
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
    color: Colors.white,
    fontSize: 14,
    fontWeight: '600' as const,
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
    fontSize: 14,
    fontWeight: '600' as const,
  },
  btnOutline: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  btnOutlineText: {
    color: Colors.primary,
    fontSize: 14,
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
    fontSize: 17,
    fontWeight: '600' as const,
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
