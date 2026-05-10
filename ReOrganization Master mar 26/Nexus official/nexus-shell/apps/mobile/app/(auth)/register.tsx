import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/stores/authStore';

export default function RegisterScreen() {
  const router = useRouter();
  const register = useAuthStore((s) => s.register);
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!displayName || !email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    setLoading(true);
    try {
      await register(email, password, displayName);
      router.replace('/(app)/dashboard');
    } catch (err: any) {
      Alert.alert('Registration Failed', err.message ?? 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.inner}>
        <Text style={styles.title}>Create Account</Text>

        <TextInput style={styles.input} placeholder="Display Name" placeholderTextColor="#71717a"
          value={displayName} onChangeText={setDisplayName} autoCorrect={false} />

        <TextInput style={styles.input} placeholder="Email" placeholderTextColor="#71717a"
          value={email} onChangeText={setEmail} keyboardType="email-address"
          autoCapitalize="none" autoCorrect={false} />

        <TextInput style={styles.input} placeholder="Password (min 8 chars)" placeholderTextColor="#71717a"
          value={password} onChangeText={setPassword} secureTextEntry />

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleRegister}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? 'Creating account...' : 'Create Account'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.link}>Already have an account? Sign in</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  inner: { flex: 1, justifyContent: 'center', paddingHorizontal: 32 },
  title: { fontSize: 28, fontWeight: '800', color: '#fff', textAlign: 'center', marginBottom: 32 },
  input: {
    backgroundColor: '#1a1a2e', color: '#fff', borderRadius: 12,
    padding: 16, fontSize: 16, marginBottom: 16,
    borderWidth: 1, borderColor: '#27272a',
  },
  button: {
    backgroundColor: '#6366f1', borderRadius: 12,
    padding: 16, alignItems: 'center', marginTop: 8, marginBottom: 24,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  link: { color: '#6366f1', textAlign: 'center', fontSize: 14 },
});
