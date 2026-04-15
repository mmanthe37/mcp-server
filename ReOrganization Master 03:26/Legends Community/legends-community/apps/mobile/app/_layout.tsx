import '../global.css';
import React, { useEffect, useState } from 'react';
import { Slot, useRouter, useSegments } from 'expo-router';
import { View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthProvider, useAuth } from '@/providers/AuthProvider';
import { QueryProvider } from '@/providers/QueryProvider';
import { ThemeProvider, useTheme } from '@/providers/ThemeProvider';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

const ONBOARDING_COMPLETE_KEY = '@legends/onboarding_complete';

function RootLayoutNav() {
  const { session, loading, initialized } = useAuth();
  const { isDark } = useTheme();
  const segments = useSegments();
  const router = useRouter();
  const [onboardingChecked, setOnboardingChecked] = useState(false);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(ONBOARDING_COMPLETE_KEY).then((value) => {
      setNeedsOnboarding(value !== 'true');
      setOnboardingChecked(true);
    });
  }, []);

  useEffect(() => {
    if (!initialized || !onboardingChecked) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inOnboarding = segments[0] === 'onboarding';

    if (needsOnboarding && !inOnboarding) {
      router.replace('/onboarding');
      return;
    }

    if (!needsOnboarding && inOnboarding) {
      router.replace('/(auth)/login');
      return;
    }

    if (!needsOnboarding && !session && !inAuthGroup && !inOnboarding) {
      router.replace('/(auth)/login');
    } else if (session && inAuthGroup) {
      router.replace('/(tabs)/wall');
    }
  }, [session, initialized, segments, router, onboardingChecked, needsOnboarding]);

  if (!initialized || !onboardingChecked) {
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
