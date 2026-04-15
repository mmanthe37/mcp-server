import '../global.css';
import React, { useEffect } from 'react';
import { Slot, useRouter, useSegments } from 'expo-router';
import { View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider, useAuth } from '@/providers/AuthProvider';
import { QueryProvider } from '@/providers/QueryProvider';
import { ThemeProvider, useTheme } from '@/providers/ThemeProvider';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

function RootLayoutNav() {
  const { session, loading, initialized } = useAuth();
  const { isDark } = useTheme();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (!initialized) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!session && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (session && inAuthGroup) {
      router.replace('/(tabs)/wall');
    }
  }, [session, initialized, segments, router]);

  if (!initialized) {
    return (
      <View className="flex-1 bg-white dark:bg-gray-900 items-center justify-center">
        <LoadingSpinner message="Loading..." />
      </View>
    );
  }

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'auto'} />
      <Slot />
    </>
  );
}

export default function RootLayout() {
  return (
    <QueryProvider>
      <AuthProvider>
        <ThemeProvider>
          <RootLayoutNav />
        </ThemeProvider>
      </AuthProvider>
    </QueryProvider>
  );
}
