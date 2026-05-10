import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'react-native';
import { useAuthStore } from '@/stores/authStore';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  return (
    <>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: colorScheme === 'dark' ? '#0a0a0a' : '#ffffff',
          },
          headerTintColor: colorScheme === 'dark' ? '#ffffff' : '#0a0a0a',
          headerTitleStyle: { fontWeight: '700' },
          contentStyle: {
            backgroundColor: colorScheme === 'dark' ? '#0a0a0a' : '#f5f5f5',
          },
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(app)" options={{ headerShown: false }} />
        <Stack.Screen
          name="terminal/[id]"
          options={{
            title: 'Terminal',
            headerBackTitle: 'Back',
            animation: 'slide_from_right',
          }}
        />
      </Stack>
    </>
  );
}
