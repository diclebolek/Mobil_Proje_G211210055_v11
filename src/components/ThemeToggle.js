import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useTheme } from '../hooks/useTheme';

const ThemeToggle = () => {
  const { theme, isDark, toggleTheme } = useTheme();

  return (
    <TouchableOpacity
      style={[styles.button, { backgroundColor: theme.colors.surface }]}
      onPress={() => toggleTheme()}
    >
      <Text style={styles.icon}>{isDark ? '☀️' : '🌙'}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  icon: {
    fontSize: 20,
  },
});

export default ThemeToggle;

