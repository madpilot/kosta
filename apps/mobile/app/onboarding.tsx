import { useState } from 'react';
import { ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { useApiClient } from '@sprout/api-client';
import type { Settings } from '@sprout/shared/schemas/settings';
import tokens from '@sprout/shared/tokens';

import { Button } from '../components/Button';

export default function OnboardingScreen() {
  const router = useRouter();
  const client = useApiClient();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState({ username: '', email: '', name: '', password: '' });
  const [location, setLocation] = useState('');
  const [hemisphereSouthern, setHemisphereSouthern] = useState(true);
  const [useOpenAI, setUseOpenAI] = useState(false);
  const [localAiBaseUrl, setLocalAiBaseUrl] = useState('http://localhost:11434');
  const [localAiModel, setLocalAiModel] = useState('llama3.2');
  const [openaiApiKey, setOpenaiApiKey] = useState('');
  const [openaiModel, setOpenaiModel] = useState('gpt-4o');
  const [weatherApiKey, setWeatherApiKey] = useState('');

  const submit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const hemisphere = hemisphereSouthern ? ('southern' as const) : ('northern' as const);
      const base = {
        location: location || undefined,
        hemisphere,
        weatherApiKey: weatherApiKey || undefined,
      };
      const settings: Settings = useOpenAI
        ? {
            ...base,
            aiBackend: 'openai',
            openaiApiKey,
            openaiModel,
          }
        : {
            ...base,
            aiBackend: 'local',
            localAiBaseUrl,
            localAiModel,
          };
      const result = (await client.onboarding.complete({ user, settings })) as {
        token?: string;
      };
      if (result.token) await SecureStore.setItemAsync('sprout_token', result.token);
      router.replace('/');
    } catch (err) {
      setError((err as Error).message ?? 'Onboarding failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Plant a seed.</Text>

        <Field
          label="Your name"
          value={user.name}
          onChangeText={(t) => setUser({ ...user, name: t })}
        />
        <Field
          label="Username"
          value={user.username}
          onChangeText={(t) => setUser({ ...user, username: t })}
        />
        <Field
          label="Email"
          value={user.email}
          onChangeText={(t) => setUser({ ...user, email: t })}
          keyboardType="email-address"
        />
        <Field
          label="Password"
          value={user.password}
          onChangeText={(t) => setUser({ ...user, password: t })}
          secure
        />
        <Field label="Where do you garden?" value={location} onChangeText={setLocation} />

        <View style={styles.toggleRow}>
          <Text style={styles.fieldLabel}>Southern hemisphere</Text>
          <Switch value={hemisphereSouthern} onValueChange={setHemisphereSouthern} />
        </View>
        <View style={styles.toggleRow}>
          <Text style={styles.fieldLabel}>Use OpenAI (instead of Local AI)</Text>
          <Switch value={useOpenAI} onValueChange={setUseOpenAI} />
        </View>
        {!useOpenAI && (
          <>
            <Field
              label="Local AI base URL"
              value={localAiBaseUrl}
              onChangeText={setLocalAiBaseUrl}
            />
            <Field label="Local AI model" value={localAiModel} onChangeText={setLocalAiModel} />
          </>
        )}
        {useOpenAI && (
          <>
            <Field
              label="OpenAI API key"
              value={openaiApiKey}
              onChangeText={setOpenaiApiKey}
              secure
            />
            <Field label="OpenAI model" value={openaiModel} onChangeText={setOpenaiModel} />
          </>
        )}
        <Field
          label="OpenWeatherMap API key (optional)"
          value={weatherApiKey}
          onChangeText={setWeatherApiKey}
          secure
        />

        {error && <Text style={styles.error}>{error}</Text>}

        <Button variant="tomato" disabled={submitting} onPress={submit}>
          {submitting ? 'Setting up…' : 'Continue →'}
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
  keyboardType,
}: {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  secure?: boolean;
  keyboardType?: 'default' | 'email-address';
}) => (
  <View style={styles.field}>
    <Text style={styles.fieldLabel}>{label}</Text>
    <TextInput
      style={styles.input}
      value={value}
      onChangeText={onChangeText}
      secureTextEntry={secure}
      autoCapitalize="none"
      keyboardType={keyboardType}
    />
  </View>
);

const styles = StyleSheet.create({
  container: {
    padding: tokens.space.lg,
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
  fieldLabel: { fontSize: 13, fontWeight: '600', color: tokens.color.inkSoft },
  input: {
    backgroundColor: tokens.color.bone,
    borderRadius: tokens.radius.sm,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: tokens.color.ink,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  error: {
    color: tokens.color.tomato[700],
    fontSize: 13,
  },
});
