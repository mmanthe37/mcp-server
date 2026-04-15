export const COLORS = {
  primary: '#3474ac',
  primaryDark: '#2a5d8a',
  primaryLight: '#4f92c6',
  navy: '#293F55',
  navyDark: '#1e2f40',
  navyLight: '#3a5570',
  white: '#ffffff',
  black: '#000000',
  gray: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827',
  },
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  info: '#3b82f6',
} as const;

export const APP = {
  name: 'Legends Community',
  communityName: 'Legends Winter Springs',
  address: '440 Courtney Springs Cir, Winter Springs, FL 32708',
  scheme: 'legends-community',
} as const;

export const TABS = [
  { name: 'wall', title: 'Home', icon: 'home' },
  { name: 'events', title: 'Events', icon: 'calendar' },
  { name: 'create', title: 'Create', icon: 'add' },
  { name: 'messages', title: 'Messages', icon: 'chatbubbles' },
  { name: 'profile', title: 'Profile', icon: 'person' },
] as const;
