import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  Modal,
  FlatList,
  Keyboard,
  TouchableWithoutFeedback,
  Platform,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../hooks/useTheme';
import ThemeToggle from '../components/ThemeToggle';
import { getNotes, saveNote, deleteNote, searchNotes, getSessions } from '../storage/storage';
import { getTodayStart } from '../utils/helpers';
import { CATEGORIES } from '../utils/constants';
import { scheduleNotification, cancelNotification, registerForPushNotificationsAsync } from '../utils/notifications';

const NotesScreen = () => {
  const { theme } = useTheme();
  const [notes, setNotes] = useState([]);
  const [filteredNotes, setFilteredNotes] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newNoteContent, setNewNoteContent] = useState('');
  const [noteType, setNoteType] = useState('daily'); // 'daily' veya 'session'
  const [selectedSessionId, setSelectedSessionId] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [filterType, setFilterType] = useState('all'); // 'all', 'today'
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  useEffect(() => {
    loadNotes();
    loadSessions();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      loadNotes();
      loadSessions();
    }, [])
  );

  useEffect(() => {
    filterNotes();
  }, [notes, searchText, filterType]);

  const loadNotes = async () => {
    try {
      const allNotes = await getNotes();
      console.log('Yüklenen notlar:', allNotes);
      setNotes(allNotes);
      return allNotes;
    } catch (error) {
      console.error('Notlar yüklenirken hata:', error);
      Alert.alert('Hata', 'Notlar yüklenemedi.');
      return [];
    }
  };

  const loadSessions = async () => {
    const allSessions = await getSessions();
    setSessions(allSessions);
  };

  const filterNotes = () => {
    let filtered = [...notes];

    // Tarih filtresi - Günlük Seans (bugüne ait seanslar)
    if (filterType === 'today') {
      const todayStart = getTodayStart();
      const todayEnd = new Date(todayStart);
      todayEnd.setHours(23, 59, 59, 999);
      
      filtered = filtered.filter((note) => {
        const noteDate = new Date(note.date);
        return noteDate >= todayStart && noteDate <= todayEnd;
      });
    }

    // Arama filtresi
    if (searchText.trim()) {
      filtered = filtered.filter((note) =>
        note.content.toLowerCase().includes(searchText.toLowerCase())
      );
    }

    setFilteredNotes(filtered);
  };

  const handleAddNote = async () => {
    if (!newNoteContent.trim()) {
      Alert.alert('Uyarı', 'Lütfen not içeriği giriniz.');
      return;
    }

    if (noteType === 'session' && !selectedSessionId) {
      Alert.alert('Uyarı', 'Lütfen bir seans seçiniz.');
      return;
    }

    Keyboard.dismiss();
    try {
      // Tarih ve saati birleştir
      const noteDate = new Date(selectedDate);
      noteDate.setHours(selectedTime.getHours());
      noteDate.setMinutes(selectedTime.getMinutes());
      noteDate.setSeconds(0);
      noteDate.setMilliseconds(0);

      const note = {
        content: newNoteContent.trim(),
        type: noteType,
        sessionId: noteType === 'session' ? selectedSessionId : null,
        date: noteDate.toISOString(),
      };

      console.log('Not kaydediliyor:', note);
      const success = await saveNote(note);
      console.log('Not kaydetme sonucu:', success);
      if (success) {
        // Bildirim zamanla
        const notificationId = await scheduleNotification(
          note.id || Date.now().toString(),
          'Not Hatırlatıcı',
          note.content.length > 50 ? note.content.substring(0, 50) + '...' : note.content,
          noteDate
        );
        
        if (notificationId) {
          console.log('Bildirim zamanlandı:', notificationId);
        }

        setNewNoteContent('');
        setSelectedSessionId(null);
        setNoteType('daily');
        setSelectedDate(new Date());
        setSelectedTime(new Date());
        setShowDatePicker(false);
        setShowTimePicker(false);
        setShowAddModal(false);
        const reloadedNotes = await loadNotes();
        console.log('Yeniden yüklenen notlar:', reloadedNotes);
        Alert.alert('Başarılı', 'Not kaydedildi ve bildirim zamanlandı.');
      } else {
        Alert.alert('Hata', 'Not kaydedilemedi. Lütfen tekrar deneyin.');
      }
    } catch (error) {
      console.error('Not kaydetme hatası:', error);
      Alert.alert('Hata', `Not kaydedilemedi: ${error.message || 'Bilinmeyen hata'}`);
    }
  };

  const handleDeleteNote = (noteId) => {
    Alert.alert(
      'Notu Sil',
      'Bu notu silmek istediğinizden emin misiniz?',
      [
        {
          text: 'İptal',
          style: 'cancel',
        },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: async () => {
            // Bildirimi iptal et
            await cancelNotification(noteId);
            
            const success = await deleteNote(noteId);
            if (success) {
              await loadNotes();
              Alert.alert('Başarılı', 'Not silindi ve bildirim iptal edildi.');
            } else {
              Alert.alert('Hata', 'Not silinemedi.');
            }
          },
        },
      ]
    );
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const todayStart = getTodayStart();

    if (date >= todayStart) {
      return `Bugün ${date.toLocaleTimeString('tr-TR', {
        hour: '2-digit',
        minute: '2-digit',
      })}`;
    }

    return date.toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getCategoryName = (categoryId) => {
    const category = CATEGORIES.find((cat) => cat.id === categoryId);
    return category ? category.name : categoryId;
  };

  const getSessionInfo = (sessionId) => {
    const session = sessions.find((s) => s.id === sessionId);
    if (!session) return null;
    return {
      category: getCategoryName(session.category),
      date: formatDate(session.date),
    };
  };

  const renderNoteItem = ({ item }) => {
    const sessionInfo = item.sessionId ? getSessionInfo(item.sessionId) : null;

    return (
      <View
        style={[
          styles.noteCard,
          {
            backgroundColor: theme.colors.card,
            shadowColor: theme.colors.shadow,
          },
        ]}
      >
        <View style={styles.noteHeader}>
          <View style={styles.noteHeaderLeft}>
            <Text
              style={[
                styles.noteTypeBadge,
                {
                  backgroundColor:
                    item.type === 'daily'
                      ? theme.colors.primary + '20'
                      : theme.colors.secondary + '20',
                  color:
                    item.type === 'daily'
                      ? theme.colors.primary
                      : theme.colors.secondary,
                },
              ]}
            >
              {item.type === 'daily' ? '📝 Günlük' : '⏱️ Seans'}
            </Text>
            {sessionInfo && (
              <Text
                style={[styles.sessionInfo, { color: theme.colors.textSecondary }]}
              >
                {sessionInfo.category}
              </Text>
            )}
          </View>
          <TouchableOpacity
            onPress={() => handleDeleteNote(item.id)}
            style={styles.deleteButton}
          >
            <Text style={[styles.deleteButtonText, { color: theme.colors.error }]}>
              ✕
            </Text>
          </TouchableOpacity>
        </View>
        <Text style={[styles.noteContent, { color: theme.colors.text }]}>
          {item.content}
        </Text>
        <Text style={[styles.noteDate, { color: theme.colors.textSecondary }]}>
          {formatDate(item.date)}
        </Text>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.header, { backgroundColor: theme.colors.background }]}>
        <Text style={[styles.appTitle, { color: theme.colors.primary }]}>FocusFlow</Text>
        <ThemeToggle />
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          style={[
            styles.searchInput,
            {
              backgroundColor: theme.colors.surface,
              color: theme.colors.text,
              borderColor: theme.colors.border,
            },
          ]}
          placeholder="Notlarda ara..."
          placeholderTextColor={theme.colors.textSecondary}
          value={searchText}
          onChangeText={setSearchText}
        />
      </View>

      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[
            styles.filterButton,
            {
              backgroundColor:
                filterType === 'all' ? theme.colors.primary : theme.colors.surface,
            },
          ]}
          onPress={() => setFilterType('all')}
        >
          <Text
            style={[
              styles.filterButtonText,
              {
                color:
                  filterType === 'all'
                    ? '#FFFFFF'
                    : theme.colors.text,
              },
            ]}
          >
            Tüm Seanslar
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.filterButton,
            {
              backgroundColor:
                filterType === 'today' ? theme.colors.primary : theme.colors.surface,
            },
          ]}
          onPress={() => setFilterType('today')}
        >
          <Text
            style={[
              styles.filterButtonText,
              {
                color:
                  filterType === 'today'
                    ? '#FFFFFF'
                    : theme.colors.text,
              },
            ]}
          >
            Günlük Seans
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={filteredNotes}
        renderItem={renderNoteItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
              {searchText.trim()
                ? 'Arama sonucu bulunamadı'
                : 'Henüz not eklenmemiş'}
            </Text>
          </View>
        }
      />

      <TouchableOpacity
        style={[styles.addButton, { backgroundColor: theme.colors.primary }]}
        onPress={() => setShowAddModal(true)}
      >
        <Text style={styles.addButtonText}>+ Yeni Not</Text>
      </TouchableOpacity>

      <Modal
        visible={showAddModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          Keyboard.dismiss();
          setShowAddModal(false);
        }}
      >
        <TouchableWithoutFeedback 
          onPress={() => {
            Keyboard.dismiss();
            setShowAddModal(false);
            setNewNoteContent('');
            setSelectedSessionId(null);
            setNoteType('daily');
            setSelectedDate(new Date());
            setSelectedTime(new Date());
            setShowDatePicker(false);
            setShowTimePicker(false);
          }}
        >
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback onPress={() => {}}>
              <View
                style={[
                  styles.modalContent,
                  { backgroundColor: theme.colors.card },
                ]}
              >
            <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
              Yeni Not Ekle
            </Text>

            <View style={styles.typeSelector}>
              <TouchableOpacity
                style={[
                  styles.typeButton,
                  {
                    backgroundColor:
                      noteType === 'daily'
                        ? theme.colors.primary
                        : theme.colors.surface,
                  },
                ]}
                onPress={() => {
                  setNoteType('daily');
                  setSelectedSessionId(null);
                }}
              >
                <Text
                  style={[
                    styles.typeButtonText,
                    {
                      color:
                        noteType === 'daily' ? '#FFFFFF' : theme.colors.text,
                    },
                  ]}
                >
                  📝 Günlük Not
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.typeButton,
                  {
                    backgroundColor:
                      noteType === 'session'
                        ? theme.colors.secondary
                        : theme.colors.surface,
                  },
                ]}
                onPress={() => setNoteType('session')}
              >
                <Text
                  style={[
                    styles.typeButtonText,
                    {
                      color:
                        noteType === 'session' ? '#FFFFFF' : theme.colors.text,
                    },
                  ]}
                >
                  ⏱️ Seans Notu
                </Text>
              </TouchableOpacity>
            </View>

            {noteType === 'session' && (
              <View style={styles.sessionSelector}>
                <Text style={[styles.label, { color: theme.colors.text }]}>
                  Kategori Seçin:
                </Text>
                <ScrollView style={styles.sessionList}>
                  {(() => {
                    // Kategorilere göre grupla ve her kategori için en son seansı bul
                    const categoryMap = {};
                    sessions.forEach((session) => {
                      const catId = session.category;
                      if (!categoryMap[catId] || new Date(session.date) > new Date(categoryMap[catId].date)) {
                        categoryMap[catId] = session;
                      }
                    });
                    
                    // Kategorileri listele
                    const uniqueCategories = Object.values(categoryMap).sort(
                      (a, b) => new Date(b.date) - new Date(a.date)
                    );
                    
                    return uniqueCategories.map((session) => {
                      const category = CATEGORIES.find((cat) => cat.id === session.category);
                      const isSelected = selectedSessionId === session.id;
                      
                      return (
                        <TouchableOpacity
                          key={session.id}
                          style={[
                            styles.sessionItem,
                            {
                              backgroundColor: isSelected
                                ? theme.colors.primary + '20'
                                : theme.colors.surface,
                              borderColor: isSelected
                                ? theme.colors.primary
                                : theme.colors.border,
                            },
                          ]}
                          onPress={() => setSelectedSessionId(session.id)}
                        >
                          <View style={styles.categoryItemContent}>
                            <Text style={styles.categoryIcon}>
                              {category?.icon || '📝'}
                            </Text>
                            <Text
                              style={[
                                styles.sessionItemText,
                                { color: theme.colors.text },
                              ]}
                            >
                              {getCategoryName(session.category)}
                            </Text>
                          </View>
                        </TouchableOpacity>
                      );
                    });
                  })()}
                </ScrollView>
              </View>
            )}

            <View style={styles.dateTimeContainer}>
              <Text style={[styles.label, { color: theme.colors.text }]}>
                Tarih ve Saat:
              </Text>
              <View style={styles.dateTimeRow}>
                <TouchableOpacity
                  style={[
                    styles.dateTimeButton,
                    {
                      backgroundColor: theme.colors.surface,
                      borderColor: theme.colors.border,
                    },
                  ]}
                  onPress={() => setShowDatePicker(true)}
                >
                  <Text style={[styles.dateTimeText, { color: theme.colors.text }]}>
                    📅 {selectedDate.toLocaleDateString('tr-TR', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                    })}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.dateTimeButton,
                    {
                      backgroundColor: theme.colors.surface,
                      borderColor: theme.colors.border,
                    },
                  ]}
                  onPress={() => setShowTimePicker(true)}
                >
                  <Text style={[styles.dateTimeText, { color: theme.colors.text }]}>
                    🕐 {selectedTime.toLocaleTimeString('tr-TR', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {showDatePicker && (
              <View style={styles.datePickerContainer}>
                <Text style={[styles.label, { color: theme.colors.text }]}>
                  Tarih Seçin:
                </Text>
                <TextInput
                  style={[
                    styles.dateInput,
                    {
                      backgroundColor: theme.colors.surface,
                      color: theme.colors.text,
                      borderColor: theme.colors.border,
                    },
                  ]}
                  placeholder="GG/AA/YYYY"
                  placeholderTextColor={theme.colors.textSecondary}
                  value={selectedDate.toLocaleDateString('tr-TR', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                  })}
                  onChangeText={(text) => {
                    const parts = text.split('/');
                    if (parts.length === 3) {
                      const day = parseInt(parts[0], 10);
                      const month = parseInt(parts[1], 10) - 1;
                      const year = parseInt(parts[2], 10);
                      if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
                        setSelectedDate(new Date(year, month, day));
                      }
                    }
                  }}
                />
                <TouchableOpacity
                  style={[
                    styles.datePickerButton,
                    { backgroundColor: theme.colors.primary },
                  ]}
                  onPress={() => setShowDatePicker(false)}
                >
                  <Text style={styles.datePickerButtonText}>Tamam</Text>
                </TouchableOpacity>
              </View>
            )}

            {showTimePicker && (
              <View style={styles.datePickerContainer}>
                <Text style={[styles.label, { color: theme.colors.text }]}>
                  Saat Seçin:
                </Text>
                <TextInput
                  style={[
                    styles.dateInput,
                    {
                      backgroundColor: theme.colors.surface,
                      color: theme.colors.text,
                      borderColor: theme.colors.border,
                    },
                  ]}
                  placeholder="SS:DD"
                  placeholderTextColor={theme.colors.textSecondary}
                  value={selectedTime.toLocaleTimeString('tr-TR', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                  onChangeText={(text) => {
                    const parts = text.split(':');
                    if (parts.length === 2) {
                      const hour = parseInt(parts[0], 10);
                      const minute = parseInt(parts[1], 10);
                      if (!isNaN(hour) && !isNaN(minute)) {
                        const newTime = new Date(selectedTime);
                        newTime.setHours(hour);
                        newTime.setMinutes(minute);
                        setSelectedTime(newTime);
                      }
                    }
                  }}
                />
                <TouchableOpacity
                  style={[
                    styles.datePickerButton,
                    { backgroundColor: theme.colors.primary },
                  ]}
                  onPress={() => setShowTimePicker(false)}
                >
                  <Text style={styles.datePickerButtonText}>Tamam</Text>
                </TouchableOpacity>
              </View>
            )}

            <TextInput
              style={[
                styles.noteInput,
                {
                  backgroundColor: theme.colors.surface,
                  color: theme.colors.text,
                  borderColor: theme.colors.border,
                },
              ]}
              placeholder="Not içeriğini giriniz..."
              placeholderTextColor={theme.colors.textSecondary}
              value={newNoteContent}
              onChangeText={setNewNoteContent}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[
                  styles.modalButton,
                  { backgroundColor: theme.colors.surface },
                ]}
                onPress={() => {
                  Keyboard.dismiss();
                  setShowAddModal(false);
                  setNewNoteContent('');
                  setSelectedSessionId(null);
                  setNoteType('daily');
                  setSelectedDate(new Date());
                  setSelectedTime(new Date());
                  setShowDatePicker(false);
                  setShowTimePicker(false);
                }}
              >
                <Text style={[styles.modalButtonText, { color: theme.colors.text }]}>
                  İptal
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalButton,
                  {
                    backgroundColor: theme.colors.primary,
                    opacity:
                      !newNoteContent.trim() ||
                      (noteType === 'session' && !selectedSessionId)
                        ? 0.5
                        : 1,
                  },
                ]}
                onPress={handleAddNote}
                disabled={
                  !newNoteContent.trim() ||
                  (noteType === 'session' && !selectedSessionId)
                }
              >
                <Text style={[styles.modalButtonText, { color: '#FFFFFF' }]}>
                  Kaydet
                </Text>
              </TouchableOpacity>
            </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  appTitle: {
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  searchInput: {
    height: 45,
    borderRadius: 12,
    paddingHorizontal: 15,
    borderWidth: 1,
    fontSize: 16,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingBottom: 10,
    gap: 10,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  listContent: {
    padding: 20,
    paddingBottom: 100,
  },
  noteCard: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  noteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  noteHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  noteTypeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    fontSize: 12,
    fontWeight: '600',
  },
  sessionInfo: {
    fontSize: 12,
    fontWeight: '500',
  },
  deleteButton: {
    padding: 5,
  },
  deleteButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  noteContent: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 8,
  },
  noteDate: {
    fontSize: 12,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
  },
  addButton: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    left: 20,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '90%',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 20,
  },
  typeSelector: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  typeButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  typeButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  sessionSelector: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
  },
  sessionList: {
    maxHeight: 150,
  },
  sessionItem: {
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
  },
  sessionItemText: {
    fontSize: 14,
    fontWeight: '500',
  },
  categoryItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  categoryIcon: {
    fontSize: 24,
  },
  noteInput: {
    minHeight: 120,
    borderRadius: 12,
    padding: 15,
    borderWidth: 1,
    fontSize: 16,
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  dateTimeContainer: {
    marginBottom: 20,
  },
  dateTimeRow: {
    flexDirection: 'row',
    gap: 10,
  },
  dateTimeButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  dateTimeText: {
    fontSize: 14,
    fontWeight: '600',
  },
  datePickerContainer: {
    marginBottom: 20,
    padding: 15,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  dateInput: {
    height: 45,
    borderRadius: 12,
    paddingHorizontal: 15,
    borderWidth: 1,
    fontSize: 16,
    marginBottom: 10,
  },
  datePickerButton: {
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
  },
  datePickerButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default NotesScreen;

