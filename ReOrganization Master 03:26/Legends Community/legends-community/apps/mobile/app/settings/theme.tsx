import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/providers/ThemeProvider';
import { themes, type ThemeMode } from '@/lib/theme';
import { COLORS } from '@/lib/constants';

const OPTIONS: { value: ThemeMode; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { value: 'light', label: 'Light', icon: 'sunny-outline' },
  { value: 'dark', label: 'Dark', icon: 'moon-outline' },
  { value: 'system', label: 'System (match device)', icon: 'phone-portrait-outline' },
];

function PreviewCard({ isDark }: { isDark: boolean }) {
  const c = isDark ? themes.dark : themes.light;

  return (
    <View
      className="rounded-2xl p-4 border mt-4"
      style={{ backgroundColor: c.surface, borderColor: c.border }}
    >
      <Text className="text-xs font-semibold mb-2" style={{ color: c.textSecondary }}>
        PREVIEW
      </Text>
      <View className="rounded-xl p-3" style={{ backgroundColor: c.card, borderColor: c.border, borderWidth: 1 }}>
        <Text className="text-base font-bold mb-1" style={{ color: c.text }}>
          Community Post
        </Text>
        <Text className="text-sm" style={{ color: c.textSecondary }}>
          This is how your content will look.
        </Text>
        <View
          className="mt-3 self-start px-4 py-2 rounded-full"
          style={{ backgroundColor: c.primary }}
        >
          <Text className="text-sm font-semibold text-white">Like</Text>
        </View>
      </View>
    </View>
  );
}

export default function ThemeSettingsScreen() {
  const { theme, setTheme, isDark } = useTheme();

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Theme',
          headerStyle: { backgroundColor: COLORS.primary },
          headerTintColor: COLORS.white,
          headerTitleStyle: { fontWeight: '700' },
        }}
      />
      <ScrollView className="flex-1 bg-gray-50 dark:bg-gray-900">
        <View className="p-4">
          <Text className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Choose how Legends Community looks to you
          </Text>

          <View className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
            {OPTIONS.map((option, index) => (
              <TouchableOpacity
                key={option.value}
                onPress={() => setTheme(option.value)}
                className={`flex-row items-center px-4 py-4 ${
                  index > 0 ? 'border-t border-gray-100 dark:border-gray-700' : ''
                }`}
                activeOpacity={0.7}
              >
                <View
                  className={`w-10 h-10 rounded-full items-center justify-center mr-3 ${
                    theme === option.value ? 'bg-primary/10' : 'bg-gray-100 dark:bg-gray-700'
                  }`}
                >
                  <Ionicons
                    name={option.icon}
                    size={20}
                    color={theme === option.value ? COLORS.primary : '#9ca3af'}
                  />
                </View>
                <Text className="flex-1 text-base font-medium text-gray-800 dark:text-gray-100">
                  {option.label}
                </Text>
                <View
                  className={`w-5 h-5 rounded-full border-2 items-center justify-center ${
                    theme === option.value ? 'border-primary' : 'border-gray-300 dark:border-gray-600'
                  }`}
                >
                  {theme === option.value && (
                    <View className="w-2.5 h-2.5 rounded-full bg-primary" />
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>

          <PreviewCard isDark={isDark} />
        </View>
      </ScrollView>
    </>
  );
}
