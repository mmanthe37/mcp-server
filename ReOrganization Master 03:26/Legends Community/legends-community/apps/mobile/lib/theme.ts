export const themes = {
  light: {
    background: '#ffffff',
    surface: '#f9fafb',
    text: '#111827',
    textSecondary: '#6b7280',
    primary: '#3474ac',
    primaryDark: '#293F55',
    border: '#e5e7eb',
    card: '#ffffff',
  },
  dark: {
    background: '#111827',
    surface: '#1f2937',
    text: '#f9fafb',
    textSecondary: '#9ca3af',
    primary: '#5b9bd5',
    primaryDark: '#1e3a5f',
    border: '#374151',
    card: '#1f2937',
  },
} as const;

export type ThemeMode = 'light' | 'dark' | 'system';
export type ThemeColors = {
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  primary: string;
  primaryDark: string;
  border: string;
  card: string;
};
