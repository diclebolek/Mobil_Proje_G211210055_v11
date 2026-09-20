import React from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { CATEGORIES } from '../utils/constants';
import { secondsToMinutes } from '../utils/helpers';

const SessionSummary = ({ visible, session, onClose }) => {
  const { theme } = useTheme();
  
  if (!session) return null;

  const category = CATEGORIES.find((cat) => cat.id === session.category);

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={[styles.overlay, { backgroundColor: theme.colors.shadow + 'CC' }]}>
        <View style={[styles.container, { 
          backgroundColor: theme.colors.card,
          shadowColor: theme.colors.shadow,
        }]}>
          <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
            <Text style={[styles.title, { color: theme.colors.text }]}>Seans Özeti</Text>
            {category && (
              <View style={[styles.categoryBadge, { backgroundColor: category.color }]}>
                <Text style={styles.categoryIcon}>{category.icon}</Text>
                <Text style={styles.categoryBadgeText}>{category.name}</Text>
              </View>
            )}
          </View>

          <View style={styles.infoContainer}>
            <View style={[styles.infoRow, { borderBottomColor: theme.colors.border }]}>
              <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Süre:</Text>
              <Text style={[styles.value, { color: theme.colors.text }]}>
                {secondsToMinutes(session.duration)} dakika
              </Text>
            </View>

            <View style={[styles.infoRow, { borderBottomColor: theme.colors.border }]}>
              <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Kategori:</Text>
              <Text style={[styles.value, { color: category?.color || theme.colors.primary }]}>
                {category?.name || 'Belirtilmemiş'}
              </Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Dikkat Dağınıklığı:</Text>
              <View style={[styles.distractionBadge, { 
                backgroundColor: session.distractions > 0 ? theme.colors.error + '20' : theme.colors.success + '20' 
              }]}>
                <Text style={[styles.distractionText, { 
                  color: session.distractions > 0 ? theme.colors.error : theme.colors.success 
                }]}>
                  {session.distractions} kez
                </Text>
              </View>
            </View>
          </View>

          <TouchableOpacity 
            style={[styles.closeButton, { backgroundColor: theme.colors.primary }]} 
            onPress={onClose}
          >
            <Text style={styles.closeButtonText}>Tamam</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    borderRadius: 24,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 16,
  },
  header: {
    alignItems: 'center',
    paddingBottom: 20,
    borderBottomWidth: 1,
    marginBottom: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    marginBottom: 12,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  categoryIcon: {
    fontSize: 18,
    marginRight: 6,
  },
  categoryBadgeText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  infoContainer: {
    marginBottom: 20,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
  },
  value: {
    fontSize: 16,
    fontWeight: '700',
  },
  distractionBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  distractionText: {
    fontSize: 14,
    fontWeight: '600',
  },
  closeButton: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  closeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default SessionSummary;
