import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { usePlant } from '@sprout/api-client';
import tokens from '@sprout/shared/tokens';

export default function PlantDetailScreen() {
  const { plantId } = useLocalSearchParams<{ plantId: string }>();
  const plant = usePlant(plantId ?? '');

  if (plant.isLoading) return <Text style={styles.body}>Loading…</Text>;
  if (plant.isError || !plant.data) return <Text style={styles.body}>Plant not found.</Text>;

  const p = plant.data;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>{p.species}</Text>
        <Text style={styles.title}>{p.name}</Text>
        {p.location && <Text style={styles.location}>📍 {p.location}</Text>}
      </View>

      <View style={styles.facts}>
        <Fact
          label="Watering"
          value={p.wateringFrequency ? `every ${p.wateringFrequency}d` : '—'}
        />
        <Fact
          label="Last watered"
          value={p.lastWatered ? new Date(p.lastWatered).toLocaleDateString() : '—'}
        />
        <Fact label="Sunlight" value={p.sunlightRequirement ?? '—'} />
        <Fact label="Soil" value={p.soilType ?? '—'} />
      </View>

      {p.notes && (
        <View style={styles.notes}>
          <Text style={styles.sectionTitle}>Notes</Text>
          <Text style={styles.notesText}>{p.notes}</Text>
        </View>
      )}
    </ScrollView>
  );
}

const Fact = ({ label, value }: { label: string; value: string }) => (
  <View style={styles.fact}>
    <Text style={styles.factLabel}>{label}</Text>
    <Text style={styles.factValue}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    padding: tokens.space.lg,
    gap: tokens.space.md,
  },
  body: { color: tokens.color.forest[200], padding: tokens.space.lg },
  header: {
    backgroundColor: tokens.color.cream,
    padding: tokens.space.xl,
    borderRadius: tokens.radius.lg,
  },
  eyebrow: {
    color: tokens.color.tomato[700],
    fontSize: 11.5,
    fontWeight: '700',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  title: {
    color: tokens.color.ink,
    fontFamily: 'Fraunces',
    fontSize: 40,
    fontWeight: '500',
    marginTop: 4,
  },
  location: {
    color: tokens.color.inkSoft,
    fontSize: 14,
    marginTop: tokens.space.sm,
  },
  facts: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: tokens.space.sm,
  },
  fact: {
    flexBasis: '48%',
    backgroundColor: tokens.color.cream,
    padding: tokens.space.md,
    borderRadius: tokens.radius.md,
  },
  factLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: tokens.color.inkMute,
    marginBottom: 4,
  },
  factValue: {
    fontSize: 16,
    fontWeight: '600',
    color: tokens.color.ink,
  },
  notes: {
    backgroundColor: tokens.color.cream,
    padding: tokens.space.lg,
    borderRadius: tokens.radius.md,
  },
  sectionTitle: {
    fontFamily: 'Fraunces',
    fontStyle: 'italic',
    fontSize: 18,
    color: tokens.color.ink,
    marginBottom: tokens.space.xs,
  },
  notesText: {
    color: tokens.color.ink,
    fontSize: 14,
    lineHeight: 20,
  },
});
