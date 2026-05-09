import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import tokens from '@sprout/shared/tokens';

type Tone = 'water' | 'fertilize' | 'harvest' | 'other';

interface Props {
  tone: Tone;
  children: ReactNode;
}

const palette: Record<Tone, { bg: string; fg: string }> = {
  water: { bg: tokens.color.water[100], fg: tokens.color.water[500] },
  fertilize: { bg: tokens.color.soil[100], fg: tokens.color.soil[500] },
  harvest: { bg: tokens.color.tomato[100], fg: tokens.color.tomato[700] },
  other: { bg: tokens.color.forest[100], fg: tokens.color.forest[700] },
};

export const Pill = ({ tone, children }: Props) => {
  const colors = palette[tone];
  return (
    <View style={[styles.pill, { backgroundColor: colors.bg }]}>
      <View style={[styles.dot, { backgroundColor: colors.fg }]} />
      <Text style={[styles.label, { color: colors.fg }]}>{children}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: tokens.radius.full,
    alignSelf: 'flex-start',
  },
  dot: { width: 6, height: 6, borderRadius: 3 },
  label: { fontSize: 11.5, fontWeight: '600', letterSpacing: 0.2 },
});
