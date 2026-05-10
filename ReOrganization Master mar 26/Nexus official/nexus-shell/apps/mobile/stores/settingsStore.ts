import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ThemeMode = 'light' | 'dark' | 'system';
export type FontFamily = 'JetBrainsMono' | 'FiraCode' | 'SFMono' | 'Menlo';

export interface TerminalSettings {
  fontSize: number;
  fontFamily: FontFamily;
  cursorStyle: 'block' | 'underline' | 'bar';
  cursorBlink: boolean;
  scrollbackLines: number;
  enableBell: boolean;
  enableHaptics: boolean;
  enableSpeculativeEcho: boolean;
}

export interface SettingsState {
  theme: ThemeMode;
  terminal: TerminalSettings;
  aiEnabled: boolean;
  biometricLock: boolean;
  notificationsEnabled: boolean;

  setTheme: (theme: ThemeMode) => void;
  updateTerminal: (patch: Partial<TerminalSettings>) => void;
  setAiEnabled: (enabled: boolean) => void;
  setBiometricLock: (enabled: boolean) => void;
  setNotificationsEnabled: (enabled: boolean) => void;
  resetDefaults: () => void;
}

const DEFAULT_TERMINAL: TerminalSettings = {
  fontSize: 14,
  fontFamily: 'JetBrainsMono',
  cursorStyle: 'block',
  cursorBlink: true,
  scrollbackLines: 10000,
  enableBell: false,
  enableHaptics: true,
  enableSpeculativeEcho: true,
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      theme: 'system' as ThemeMode,
      terminal: { ...DEFAULT_TERMINAL },
      aiEnabled: true,
      biometricLock: true,
      notificationsEnabled: true,

      setTheme: (theme) => set({ theme }),
      updateTerminal: (patch) =>
        set((state) => ({
          terminal: { ...state.terminal, ...patch },
        })),
      setAiEnabled: (aiEnabled) => set({ aiEnabled }),
      setBiometricLock: (biometricLock) => set({ biometricLock }),
      setNotificationsEnabled: (notificationsEnabled) =>
        set({ notificationsEnabled }),
      resetDefaults: () =>
        set({
          theme: 'system',
          terminal: { ...DEFAULT_TERMINAL },
          aiEnabled: true,
          biometricLock: true,
          notificationsEnabled: true,
        }),
    }),
    {
      name: 'nexus-settings-storage',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
