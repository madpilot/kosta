import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Link } from 'expo-router';
import { useTodayEvents, useCompleteEvent, usePlants } from '@sprout/api-client';
import tokens from '@sprout/shared/tokens';

import { Pill } from '../components/Pill';
import { Button } from '../components/Button';

const eventTone = (type: string) => {
  if (type === 'water' || type === 'fertilize' || type === 'harvest') return type;
  return 'other' as const;
};

export default function TodayScreen() {
  const events = useTodayEvents();
  const plants = usePlants();
  const complete = useCompleteEvent();

  const plantName = (id: string) => plants.data?.find((p) => p.id === id)?.name ?? 'Unknown plant';

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.topRow}>
        <Text style={styles.eyebrow}>Today</Text>
        <Link href="/settings" asChild>
          <Pressable accessibilityRole="link" hitSlop={8}>
            <Text style={styles.settingsLink}>Settings</Text>
          </Pressable>
        </Link>
      </View>
      <Text style={styles.title}>What's blooming today.</Text>

      {events.isLoading && <Text style={styles.body}>Loading…</Text>}

      {events.data?.map((event) => (
        <View key={event.id} style={styles.card}>
          <View style={styles.row}>
            <Pill tone={eventTone(event.type)}>{event.type}</Pill>
            <Text style={styles.plant}>{plantName(event.plantId)}</Text>
          </View>
          {event.notes && <Text style={styles.notes}>{event.notes}</Text>}
          <Button
            variant="forest"
            disabled={event.completed || complete.isPending}
            onPress={() => complete.mutate({ id: event.id })}
          >
            {event.completed ? 'Done' : 'Mark done'}
          </Button>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: tokens.space.lg,
    gap: tokens.space.md,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  eyebrow: {
    color: tokens.color.tomato[300],
    fontSize: 11.5,
    fontWeight: '700',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  settingsLink: {
    color: tokens.color.cream,
    opacity: 0.78,
    fontSize: 14,
    fontWeight: '600',
  },
  title: {
    color: tokens.color.cream,
    fontFamily: 'Fraunces',
    fontSize: 36,
    fontWeight: '500',
    marginBottom: tokens.space.md,
  },
  body: {
    color: tokens.color.forest[200],
  },
  card: {
    backgroundColor: tokens.color.cream,
    padding: tokens.space.lg,
    borderRadius: tokens.radius.lg,
    gap: tokens.space.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.space.sm,
  },
  plant: {
    fontSize: 16,
    fontWeight: '600',
    color: tokens.color.ink,
  },
  notes: {
    color: tokens.color.inkSoft,
    fontSize: 14,
    lineHeight: 20,
  },
});
