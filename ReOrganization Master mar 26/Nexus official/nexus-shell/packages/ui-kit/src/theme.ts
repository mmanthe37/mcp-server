// NexusShell Design Tokens

export const colors = {
  // Core palette
  primary: '#6C5CE7',
  primaryLight: '#A29BFE',
  primaryDark: '#4B3BC2',
  accent: '#00B894',
  accentLight: '#55EFC4',
  
  // Semantic
  success: '#00B894',
  warning: '#FDCB6E',
  error: '#FF6B6B',
  info: '#74B9FF',
  
  // Terminal
  terminalBg: '#1A1A2E',
  terminalFg: '#E4E4E4',
  terminalCursor: '#6C5CE7',
  terminalSelection: 'rgba(108, 92, 231, 0.3)',
  
  // Surface (dark mode primary)
  background: '#0F0F23',
  surface: '#1A1A2E',
  surfaceElevated: '#252542',
  surfaceOverlay: 'rgba(0, 0, 0, 0.6)',
  
  // Text
  textPrimary: '#FFFFFF',
  textSecondary: '#A0A0B8',
  textMuted: '#6C6C80',
  textInverse: '#0F0F23',
  
  // Border
  border: '#2D2D4A',
  borderFocused: '#6C5CE7',
  
  // Risk levels
  riskSafe: '#00B894',
  riskElevated: '#FDCB6E',
  riskDangerous: '#FF6B6B',
  riskCritical: '#E84393',
  
  // ANSI terminal colors
  ansi: {
    black: '#1A1A2E',
    red: '#FF6B6B',
    green: '#00B894',
    yellow: '#FDCB6E',
    blue: '#74B9FF',
    magenta: '#A29BFE',
    cyan: '#00CEC9',
    white: '#DFE6E9',
    brightBlack: '#636E72',
    brightRed: '#FF7675',
    brightGreen: '#55EFC4',
    brightYellow: '#FFEAA7',
    brightBlue: '#81ECEC',
    brightMagenta: '#D4A5FF',
    brightCyan: '#81ECEC',
    brightWhite: '#FFFFFF',
  },
} as const;

export const spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const typography = {
  mono: {
    fontFamily: 'JetBrainsMono-Regular',
    fontSize: 14,
    lineHeight: 20,
  },
  monoBold: {
    fontFamily: 'JetBrainsMono-Bold',
    fontSize: 14,
    lineHeight: 20,
  },
  body: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    lineHeight: 24,
  },
  bodySmall: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    lineHeight: 20,
  },
  heading: {
    fontFamily: 'Inter-Bold',
    fontSize: 24,
    lineHeight: 32,
  },
  subheading: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
    lineHeight: 24,
  },
  caption: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    lineHeight: 16,
  },
  label: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    lineHeight: 20,
  },
} as const;

export const borderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
} as const;
