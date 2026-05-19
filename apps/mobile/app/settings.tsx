import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { useSettings, useUpdateSettings } from '@sprout/api-client';
import type { LogFormat, LogLevel, Settings } from '@sprout/shared/schemas/settings';
import tokens from '@sprout/shared/tokens';

import { Button } from '../components/Button';

type FormState = {
  aiBackend: 'local' | 'openai';
  localAiBaseUrl: string;
  localAiModel: string;
  openaiApiKey: string;
  openaiModel: string;
  location: string;
  hemisphereSouthern: boolean;
  weatherApiKey: string;
  appBaseUrl: string;
  aiPreamble: string;
  logLevel: LogLevel | '';
  logFormat: LogFormat | '';
};

const emptyForm: FormState = {
  aiBackend: 'local',
  localAiBaseUrl: '',
  localAiModel: '',
  openaiApiKey: '',
  openaiModel: '',
  location: '',
  hemisphereSouthern: true,
  weatherApiKey: '',
  appBaseUrl: '',
  aiPreamble: '',
  logLevel: '',
  logFormat: '',
};

const fromSettings = (s: Settings): FormState => ({
  aiBackend: s.aiBackend,
  localAiBaseUrl: s.localAiBaseUrl ?? '',
  localAiModel: s.localAiModel ?? '',
  openaiApiKey: s.openaiApiKey ?? '',
  openaiModel: s.openaiModel ?? '',
  location: s.location ?? '',
  hemisphereSouthern: s.hemisphere === 'southern',
  weatherApiKey: s.weatherApiKey ?? '',
  appBaseUrl: s.appBaseUrl ?? '',
  aiPreamble: s.aiPreamble ?? '',
  logLevel: s.logLevel ?? '',
  logFormat: s.logFormat ?? '',
});

const toPayload = (f: FormState): Settings => {
  const payload: Settings = {
    aiBackend: f.aiBackend,
    hemisphere: f.hemisphereSouthern ? 'southern' : 'northern',
  };
  if (f.aiBackend === 'local') {
    if (f.localAiBaseUrl) payload.localAiBaseUrl = f.localAiBaseUrl;
    if (f.localAiModel) payload.localAiModel = f.localAiModel;
  } else {
    if (f.openaiApiKey) payload.openaiApiKey = f.openaiApiKey;
    if (f.openaiModel) payload.openaiModel = f.openaiModel;
  }
  if (f.location) payload.location = f.location;
  if (f.weatherApiKey) payload.weatherApiKey = f.weatherApiKey;
  if (f.appBaseUrl) payload.appBaseUrl = f.appBaseUrl;
  if (f.aiPreamble) payload.aiPreamble = f.aiPreamble;
  if (f.logLevel) payload.logLevel = f.logLevel;
  if (f.logFormat) payload.logFormat = f.logFormat;
  return payload;
};

export default function SettingsScreen() {
  const settings = useSettings();
  const update = useUpdateSettings();
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (settings.data) setForm(fromSettings(settings.data));
  }, [settings.data]);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const submit = () => {
    setSaved(false);
    update.mutate(toPayload(form), {
      onSuccess: () => setSaved(true),
    });
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.eyebrow}>Settings</Text>
      <Text style={styles.title}>Tune your garden.</Text>
      <Text style={styles.lede}>Changes take effect immediately — no restart needed.</Text>

      {settings.isLoading && <Text style={styles.loading}>Loading…</Text>}

      {settings.data && (
        <View style={styles.card}>
          <Section title="Location">
            <Field
              label="Where do you garden?"
              value={form.location}
              onChangeText={(t) => set('location', t)}
            />
            <View style={styles.toggleRow}>
              <Text style={styles.fieldLabel}>Southern hemisphere</Text>
              <Switch
                value={form.hemisphereSouthern}
                onValueChange={(v) => set('hemisphereSouthern', v)}
              />
            </View>
          </Section>

          <Divider />

          <Section title="AI backend">
            <View style={styles.toggleRow}>
              <Text style={styles.fieldLabel}>Use OpenAI (instead of Local AI)</Text>
              <Switch
                value={form.aiBackend === 'openai'}
                onValueChange={(v) => set('aiBackend', v ? 'openai' : 'local')}
              />
            </View>
            {form.aiBackend === 'local' && (
              <>
                <Field
                  label="Local AI base URL"
                  value={form.localAiBaseUrl}
                  onChangeText={(t) => set('localAiBaseUrl', t)}
                  placeholder="http://localhost:8080/v1"
                />
                <Field
                  label="Local AI model"
                  value={form.localAiModel}
                  onChangeText={(t) => set('localAiModel', t)}
                  placeholder="llama3.2"
                />
              </>
            )}
            {form.aiBackend === 'openai' && (
              <>
                <Field
                  label="OpenAI API key"
                  value={form.openaiApiKey}
                  onChangeText={(t) => set('openaiApiKey', t)}
                  secure
                />
                <Field
                  label="OpenAI model"
                  value={form.openaiModel}
                  onChangeText={(t) => set('openaiModel', t)}
                  placeholder="gpt-4o"
                />
              </>
            )}
            <Field
              label="System preamble (optional)"
              value={form.aiPreamble}
              onChangeText={(t) => set('aiPreamble', t)}
              multiline
            />
          </Section>

          <Divider />

          <Section title="Weather" hint="An OpenWeatherMap API key enables forecast-aware advice.">
            <Field
              label="OpenWeatherMap API key"
              value={form.weatherApiKey}
              onChangeText={(t) => set('weatherApiKey', t)}
              secure
            />
          </Section>

          <Divider />

          <Section title="Advanced" hint="Most installs don't need to change these.">
            <Field
              label="Public app URL"
              value={form.appBaseUrl}
              onChangeText={(t) => set('appBaseUrl', t)}
              placeholder="http://localhost:3000"
            />
          </Section>

          <Button variant="tomato" disabled={update.isPending} onPress={submit}>
            {update.isPending ? 'Saving…' : 'Save settings'}
          </Button>

          {saved && !update.isPending && <Text style={styles.success}>Saved.</Text>}
          {update.isError && (
            <Text style={styles.error}>
              {update.error instanceof Error ? update.error.message : 'Save failed.'}
            </Text>
          )}
        </View>
      )}
    </ScrollView>
  );
}

const Section = ({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>{title}</Text>
    {hint && <Text style={styles.sectionHint}>{hint}</Text>}
    {children}
  </View>
);

const Divider = () => <View style={styles.divider} />;

const Field = ({
  label,
  value,
  onChangeText,
  secure,
  placeholder,
  multiline,
}: {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  secure?: boolean;
  placeholder?: string;
  multiline?: boolean;
}) => (
  <View style={styles.field}>
    <Text style={styles.fieldLabel}>{label}</Text>
    <TextInput
      style={[styles.input, multiline ? styles.textarea : null]}
      value={value}
      onChangeText={onChangeText}
      secureTextEntry={secure}
      autoCapitalize="none"
      placeholder={placeholder}
      placeholderTextColor={tokens.color.inkMute}
      multiline={multiline}
    />
  </View>
);

const styles = StyleSheet.create({
  container: {
    padding: tokens.space.lg,
    gap: tokens.space.md,
  },
  eyebrow: {
    color: tokens.color.tomato[300],
    fontSize: 11.5,
    fontWeight: '700',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  title: {
    color: tokens.color.cream,
    fontFamily: 'Fraunces',
    fontSize: 32,
    fontWeight: '500',
  },
  lede: {
    color: tokens.color.forest[200],
    fontSize: 14,
    marginBottom: tokens.space.sm,
  },
  loading: {
    color: tokens.color.forest[200],
  },
  card: {
    backgroundColor: tokens.color.cream,
    padding: tokens.space.lg,
    borderRadius: tokens.radius.lg,
    gap: tokens.space.lg,
  },
  section: { gap: tokens.space.sm },
  sectionTitle: {
    fontFamily: 'Fraunces',
    fontSize: 20,
    fontWeight: '600',
    color: tokens.color.ink,
  },
  sectionHint: {
    fontSize: 13,
    color: tokens.color.inkSoft,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.08)',
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
  textarea: {
    minHeight: 120,
    textAlignVertical: 'top',
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
  success: {
    color: tokens.color.forest[700],
    fontSize: 13,
  },
});
