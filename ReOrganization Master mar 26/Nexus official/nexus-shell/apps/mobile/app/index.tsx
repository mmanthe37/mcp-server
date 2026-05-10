import { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/stores/authStore';

export default function SplashScreen() {
  const router = useRouter();
  const { isAuthenticated, isLoading, initialize } = useAuthStore();

  useEffect(() => {
    initialize().then(() => {
      if (isAuthenticated) {
        router.replace('/(app)');
      } else {
        router.replace('/(auth)/login');
      }
    });
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.logo}>⚡</Text>
      <Text style={styles.title}>NexusShell</Text>
      <Text style={styles.subtitle}>Neural Extensible Universal System</Text>
      <ActivityIndicator size="large" color="#6366f1" style={styles.spinner} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0a0a0a',
  },
  logo: { fontSize: 64, marginBottom: 16 },
  title: { fontSize: 32, fontWeight: '800', color: '#ffffff', letterSpacing: 2 },
  subtitle: { fontSize: 14, color: '#a1a1aa', marginTop: 8, letterSpacing: 1 },
  spinner: { marginTop: 48 },
});
