import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useCalendarEvents, usePlants } from '@sprout/api-client';
import tokens from '@sprout/shared/tokens';

import { Pill } from '../components/Pill';

const eventTone = (type: string) => {
  if (type === 'water' || type === 'fertilize' || type === 'harvest') return type;
  return 'other' as const;
};

export default function CalendarScreen() {
  const events = useCalendarEvents();
  const plants = usePlants();
  const router = useRouter();

  const groups = useMemo(() => {
    const map = new Map<string, NonNullable<typeof events.data>>();
    for (const event of events.data ?? []) {
      const key = event.date.slice(0, 10);
      const list = map.get(key) ?? [];
      list.push(event);
      map.set(key, list);
    }
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [events.data]);

  const plantName = (id: string) => plants.data?.find((p) => p.id === id)?.name ?? 'Unknown plant';

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.eyebrow}>Calendar</Text>
      <Text style={styles.title}>The shape of your week.</Text>

      {groups.map(([date, items]) => (
        <View key={date} style={styles.group}>
          <Text style={styles.date}>{date}</Text>
          {items.map((event) => (
            <Pressable
              key={event.id}
              style={styles.row}
              onPress={() => router.push(`/plants/${event.plantId}`)}
            >
              <Pill tone={eventTone(event.type)}>{event.type}</Pill>
              <Text style={styles.plant}>{plantName(event.plantId)}</Text>
            </Pressable>
          ))}
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
    marginBottom: tokens.space.md,
  },
  group: {
    backgroundColor: tokens.color.cream,
    padding: tokens.space.md,
    borderRadius: tokens.radius.md,
    gap: tokens.space.xs,
  },
  date: {
    fontWeight: '600',
    color: tokens.color.ink,
    marginBottom: tokens.space.xs,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.space.sm,
    paddingVertical: 4,
  },
  plant: {
    color: tokens.color.ink,
    fontWeight: '500',
  },
});
