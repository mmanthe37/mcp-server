import { Stack } from 'expo-router';
import { useColorScheme } from 'react-native';

export default function AppLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: isDark ? '#1a1a2e' : '#ffffff',
        },
        headerTintColor: isDark ? '#00d4ff' : '#0a0a1a',
        headerTitleStyle: { fontWeight: '700' },
        contentStyle: {
          backgroundColor: isDark ? '#0a0a1a' : '#f5f5f5',
        },
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Sessions' }} />
      <Stack.Screen
        name="terminal"
        options={{
          title: 'Terminal',
          headerShown: false,
          gestureEnabled: false,
        }}
      />
      <Stack.Screen name="devices" options={{ title: 'Devices' }} />
      <Stack.Screen name="settings" options={{ title: 'Settings' }} />
    </Stack>
  );
}
