import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useThemeMode } from '@/hooks/theme-mode';

export function ThemeModeToggle() {
  const { activeTheme, setThemeMode } = useThemeMode();

  return (
    <View style={styles.container}>
      <ThemedText type="subtitle">Theme</ThemedText>
      <View style={styles.buttonRow}>
        <Pressable
          accessibilityRole="button"
          style={[styles.button, activeTheme === 'light' && styles.activeButton]}
          onPress={() => setThemeMode('light')}>
          <ThemedText style={styles.buttonLabel}>Light</ThemedText>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          style={[styles.button, activeTheme === 'dark' && styles.activeButton]}
          onPress={() => setThemeMode('dark')}>
          <ThemedText style={styles.buttonLabel}>Dark</ThemedText>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 10,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#8a8a8a',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  activeButton: {
    borderColor: '#0a7ea4',
    backgroundColor: 'rgba(10, 126, 164, 0.15)',
  },
  buttonLabel: {
    fontSize: 16,
  },
});
