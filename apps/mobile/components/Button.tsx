import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import tokens from '@sprout/shared/tokens';

type Variant = 'tomato' | 'forest' | 'cream' | 'ghost';

interface Props {
  variant?: Variant;
  onPress?: () => void;
  disabled?: boolean;
  children: ReactNode;
}

export const Button = ({ variant = 'tomato', onPress, disabled, children }: Props) => (
  <Pressable
    accessibilityRole="button"
    onPress={onPress}
    disabled={disabled}
    style={({ pressed }) => [
      styles.btn,
      styles[variant],
      pressed && !disabled ? styles.pressed : null,
      disabled ? styles.disabled : null,
    ]}
  >
    <Text style={[styles.label, variant === 'cream' ? styles.labelDark : styles.labelLight]}>
      {children}
    </Text>
  </Pressable>
);

const styles = StyleSheet.create({
  btn: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: tokens.radius.full,
    alignItems: 'center',
  },
  tomato: { backgroundColor: tokens.color.tomato[500] },
  forest: { backgroundColor: tokens.color.forest[700] },
  cream: { backgroundColor: tokens.color.cream },
  ghost: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(255, 248, 238, 0.18)',
  },
  pressed: { opacity: 0.85 },
  disabled: { opacity: 0.5 },
  label: { fontSize: 14, fontWeight: '600' },
  labelLight: { color: tokens.color.cream },
  labelDark: { color: tokens.color.ink },
});
