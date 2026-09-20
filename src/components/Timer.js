import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { formatTime } from '../utils/helpers';

const Timer = ({ seconds, isRunning, isPaused, onPress }) => {
  const { theme } = useTheme();

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={[styles.timerCircle, { 
        borderColor: isRunning ? theme.colors.primary : (isPaused ? theme.colors.warning : theme.colors.border),
        backgroundColor: theme.colors.surface,
      }]}>
        <Text style={[styles.timeText, { 
          color: isRunning ? theme.colors.primary : (isPaused ? theme.colors.warning : theme.colors.text)
        }]}>
          {formatTime(seconds)}
        </Text>
        {!isRunning && !isPaused && (
          <Text style={[styles.hintText, { color: theme.colors.textSecondary }]}>
            Başlatmak için dokunun
          </Text>
        )}
        {isPaused && (
          <Text style={[styles.hintText, { color: theme.colors.warning }]}>
            Duraklatıldı - Devam için dokunun
          </Text>
        )}
        {isRunning && (
          <Text style={[styles.hintText, { color: theme.colors.primary }]}>
            Duraklatmak için dokunun
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 30,
  },
  timerCircle: {
    width: 220,
    height: 220,
    borderRadius: 110,
    borderWidth: 4,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  timeText: {
    fontSize: 64,
    fontWeight: '700',
    letterSpacing: 2,
  },
  hintText: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 8,
  },
});

export default Timer;
