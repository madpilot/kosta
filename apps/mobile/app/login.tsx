import { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { useLogin } from '@sprout/api-client';
import tokens from '@sprout/shared/tokens';

import { Button } from '../components/Button';

export default function LoginScreen() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const login = useLogin({
    onSuccess: async (data) => {
      const result = data as { token?: string };
      if (result.token) await SecureStore.setItemAsync('sprout_token', result.token);
      router.replace('/');
    },
  });

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Welcome back.</Text>
        <Field label="Username" value={username} onChangeText={setUsername} />
        <Field label="Password" value={password} onChangeText={setPassword} secure />
        {login.isError && <Text style={styles.error}>Login failed. Try again.</Text>}
        <Button
          variant="tomato"
          disabled={login.isPending}
          onPress={() => login.mutate({ username, password })}
        >
          {login.isPending ? 'Signing in…' : 'Sign in'}
        </Button>
      </View>
    </ScrollView>
  );
}

const Field = ({
  label,
  value,
  onChangeText,
  secure,
}: {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  secure?: boolean;
}) => (
  <View style={styles.field}>
    <Text style={styles.fieldLabel}>{label}</Text>
    <TextInput
      style={styles.input}
      value={value}
      onChangeText={onChangeText}
      secureTextEntry={secure}
      autoCapitalize="none"
    />
  </View>
);

const styles = StyleSheet.create({
  container: {
    padding: tokens.space.lg,
    flexGrow: 1,
    justifyContent: 'center',
  },
  card: {
    backgroundColor: tokens.color.cream,
    padding: tokens.space.xl,
    borderRadius: tokens.radius.lg,
    gap: tokens.space.md,
  },
  title: {
    fontFamily: 'Fraunces',
    fontSize: 32,
    fontWeight: '500',
    color: tokens.color.ink,
  },
  field: { gap: 6 },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: tokens.color.inkSoft,
  },
  input: {
    backgroundColor: tokens.color.bone,
    borderRadius: tokens.radius.sm,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: tokens.color.ink,
  },
  error: {
    color: tokens.color.tomato[700],
    fontSize: 13,
  },
});
