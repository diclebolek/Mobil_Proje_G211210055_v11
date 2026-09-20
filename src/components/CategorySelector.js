import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, TextInput, Modal, Alert, ScrollView, Animated } from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { CATEGORIES } from '../utils/constants';
import { getSettings, saveSettings, getCustomCategories, saveCustomCategories } from '../storage/storage';

const CategorySelector = ({ selectedCategory, onSelectCategory, disabled, onCategorySelect, onDurationChange, onCategoriesChange }) => {
  const { theme } = useTheme();
  const [editingCategory, setEditingCategory] = useState(null);
  const [durationValue, setDurationValue] = useState('');
  const [hours, setHours] = useState(0);
  const [minutes, setMinutes] = useState(25);
  const [seconds, setSeconds] = useState(0);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryDuration, setNewCategoryDuration] = useState('25');
  const [newCategoryIcon, setNewCategoryIcon] = useState('📝');
  const [customCategories, setCustomCategories] = useState([]);
  const [allCategories, setAllCategories] = useState([...CATEGORIES]);
  const [hiddenCategories, setHiddenCategories] = useState([]);
  const scrollViewRef = useRef(null);
  const scrollY = useRef(new Animated.Value(0)).current;
  const [scrollIndicatorVisible, setScrollIndicatorVisible] = useState(false);
  const [scrollThumbHeight, setScrollThumbHeight] = useState(60);
  const hoursScrollRef = useRef(null);
  const minutesScrollRef = useRef(null);
  const secondsScrollRef = useRef(null);

  const iconOptions = ['📚', '💻', '🚀', '📖', '📝', '🎨', '🏃', '🧘', '🎵', '🎬', '✍️', '🔬'];

  useEffect(() => {
    loadCustomCategories();
    loadHiddenCategories();
  }, []);

  const loadCustomCategories = async () => {
    const custom = await getCustomCategories();
    setCustomCategories(custom);
    await updateAllCategories(custom);
  };

  const loadHiddenCategories = async () => {
    const settings = await getSettings();
    const hidden = settings.hiddenCategories || [];
    setHiddenCategories(hidden);
  };

  const updateAllCategories = async (custom) => {
    const settings = await getSettings();
    const hidden = settings.hiddenCategories || [];
    const visibleDefault = CATEGORIES.filter((cat) => !hidden.includes(cat.id));
    setAllCategories([...visibleDefault, ...custom]);
  };

  const handleCategoryPress = (categoryId) => {
    if (!disabled) {
      onSelectCategory(categoryId);
      if (onCategorySelect) {
        const category = allCategories.find((cat) => cat.id === categoryId);
        onCategorySelect(category);
      }
    }
  };

  const handleEditDuration = (category, event) => {
    event?.stopPropagation();
    setEditingCategory(category);
    const totalSeconds = category.defaultDuration * 60; // dakika -> saniye
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    setHours(h);
    setMinutes(m);
    setSeconds(s);
    setDurationValue(category.defaultDuration.toString());
  };

  const handleSaveDuration = async () => {
    // Toplam süreyi dakika cinsinden hesapla
    const totalSeconds = hours * 3600 + minutes * 60 + seconds;
    const newDuration = Math.round(totalSeconds / 60); // saniye -> dakika
    
    if (totalSeconds < 60) {
      Alert.alert('Hata', 'Lütfen en az 1 dakika süre giriniz.');
      return;
    }

    if (newDuration > 1440) { // 24 saat = 1440 dakika
      Alert.alert('Hata', 'Lütfen 24 saatten az bir süre giriniz.');
      return;
    }

    // Kategori süresini güncelle
    const categoryIndex = allCategories.findIndex((cat) => cat.id === editingCategory.id);
    if (categoryIndex !== -1) {
      allCategories[categoryIndex].defaultDuration = newDuration;
    }

    // Özel kategorilerde ise kaydet
    const isCustom = customCategories.some((cat) => cat.id === editingCategory.id);
    if (isCustom) {
      const updatedCustom = customCategories.map((cat) =>
        cat.id === editingCategory.id ? { ...cat, defaultDuration: newDuration } : cat
      );
      await saveCustomCategories(updatedCustom);
      setCustomCategories(updatedCustom);
    }

    // Ayarları kaydet
    const settings = await getSettings();
    const categoryDurations = settings.categoryDurations || {};
    categoryDurations[editingCategory.id] = newDuration;
    await saveSettings({ ...settings, categoryDurations });

    if (onDurationChange) {
      onDurationChange(editingCategory.id, newDuration);
    }

    setEditingCategory(null);
    setDurationValue('');
    setHours(0);
    setMinutes(25);
    setSeconds(0);
    loadCustomCategories();
  };

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) {
      Alert.alert('Hata', 'Lütfen kategori adı giriniz.');
      return;
    }

    const duration = parseInt(newCategoryDuration);
    if (isNaN(duration) || duration < 1 || duration > 120) {
      Alert.alert('Hata', 'Lütfen 1-120 arasında bir süre giriniz.');
      return;
    }

    const newCategory = {
      id: `custom_${Date.now()}`,
      name: newCategoryName.trim(),
      color: `#${Math.floor(Math.random() * 16777215).toString(16)}`,
      defaultDuration: duration,
      icon: newCategoryIcon,
    };

    const updatedCustom = [...customCategories, newCategory];
    await saveCustomCategories(updatedCustom);
    setCustomCategories(updatedCustom);
    
    const settings = await getSettings();
    const hidden = settings.hiddenCategories || [];
    const visibleDefault = CATEGORIES.filter((cat) => !hidden.includes(cat.id));
    setAllCategories([...visibleDefault, ...updatedCustom]);

    if (onCategoriesChange) {
      onCategoriesChange([...visibleDefault, ...updatedCustom]);
    }

    setShowAddModal(false);
    setNewCategoryName('');
    setNewCategoryDuration('25');
    setNewCategoryIcon('📝');
  };

  const handleDeleteCategory = async (category) => {
    const isCustom = customCategories.some((cat) => cat.id === category.id);
    const isDefault = CATEGORIES.some((cat) => cat.id === category.id);

    Alert.alert(
      'Kategoriyi Sil',
      `${category.name} kategorisini ${isCustom ? 'silmek' : 'gizlemek'} istediğinize emin misiniz?`,
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: isCustom ? 'Sil' : 'Gizle',
          style: 'destructive',
          onPress: async () => {
            if (isCustom) {
              // Özel kategoriyi tamamen sil
              const updatedCustom = customCategories.filter((cat) => cat.id !== category.id);
              await saveCustomCategories(updatedCustom);
              setCustomCategories(updatedCustom);
              
              const settings = await getSettings();
              const hidden = settings.hiddenCategories || [];
              const visibleDefault = CATEGORIES.filter((cat) => !hidden.includes(cat.id));
              setAllCategories([...visibleDefault, ...updatedCustom]);
              
              if (onCategoriesChange) {
                onCategoriesChange([...visibleDefault, ...updatedCustom]);
              }
            } else if (isDefault) {
              // Varsayılan kategoriyi gizle
              const settings = await getSettings();
              const hidden = settings.hiddenCategories || [];
              if (!hidden.includes(category.id)) {
                hidden.push(category.id);
                await saveSettings({ ...settings, hiddenCategories: hidden });
                setHiddenCategories(hidden);
                
                const visibleDefault = CATEGORIES.filter((cat) => !hidden.includes(cat.id));
                setAllCategories([...visibleDefault, ...customCategories]);
                
                if (onCategoriesChange) {
                  onCategoriesChange([...visibleDefault, ...customCategories]);
                }
              }
            }
            
            if (selectedCategory === category.id) {
              onSelectCategory(null);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={[styles.label, { color: theme.colors.text }]}>Kategori Seçiniz:</Text>
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: theme.colors.primary }]}
          onPress={() => setShowAddModal(true)}
          disabled={disabled}
        >
          <Text style={styles.addButtonText}>+ Yeni</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.scrollContainer}>
        <ScrollView 
          ref={scrollViewRef}
          style={styles.categoriesScroll}
          showsVerticalScrollIndicator={false}
          nestedScrollEnabled={true}
          contentContainerStyle={styles.scrollContent}
          onContentSizeChange={(contentWidth, contentHeight) => {
            const canScroll = contentHeight > 300;
            setScrollIndicatorVisible(canScroll);
            
            if (canScroll) {
              // Thumb boyutunu hesapla (görünen alan / toplam içerik)
              const visibleRatio = 300 / contentHeight;
              const thumbHeight = Math.max(40, 300 * visibleRatio);
              setScrollThumbHeight(thumbHeight);
            }
          }}
          onScroll={(event) => {
            const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
            const scrollableHeight = contentSize.height - layoutMeasurement.height;
            
            if (scrollableHeight > 0 && scrollThumbHeight > 0) {
              const scrollPercentage = contentOffset.y / scrollableHeight;
              const maxTranslate = 300 - scrollThumbHeight - 8; // 8 = padding
              scrollY.setValue(scrollPercentage * maxTranslate);
            }
          }}
          scrollEventThrottle={16}
        >
          <View style={styles.categoriesContainer}>
          {allCategories.map((category) => {
            const isSelected = selectedCategory === category.id;
            const isCustom = customCategories.some((cat) => cat.id === category.id);
            return (
              <TouchableOpacity
                key={category.id}
                style={[
                  styles.categoryCard,
                  {
                    backgroundColor: isSelected ? category.color : theme.colors.card,
                    borderColor: isSelected ? category.color : theme.colors.border,
                    opacity: disabled ? 0.5 : 1,
                    shadowColor: theme.colors.shadow,
                  },
                ]}
                onPress={() => handleCategoryPress(category.id)}
                disabled={disabled}
                activeOpacity={0.7}
              >
                <View style={styles.categoryContent}>
                  <View style={styles.categoryLeft}>
                    <Text style={styles.icon}>{category.icon}</Text>
                    <View style={styles.categoryInfo}>
                      <Text
                        style={[
                          styles.categoryText,
                          {
                            color: isSelected ? '#FFFFFF' : theme.colors.text,
                          },
                        ]}
                      >
                        {category.name}
                      </Text>
                      <Text
                        style={[
                          styles.durationText,
                          {
                            color: isSelected ? 'rgba(255,255,255,0.9)' : theme.colors.textSecondary,
                          },
                        ]}
                      >
                        {category.defaultDuration} dakika
                      </Text>
                    </View>
                  </View>
                  <View style={styles.categoryActions}>
                    <TouchableOpacity
                      style={[styles.editButton, { backgroundColor: isSelected ? 'rgba(255,255,255,0.2)' : theme.colors.surface }]}
                      onPress={(e) => {
                        e.stopPropagation();
                        handleEditDuration(category, e);
                      }}
                      disabled={disabled}
                    >
                      <Text style={[styles.editButtonText, { color: isSelected ? '#FFFFFF' : theme.colors.text }]}>
                        ⚙️
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.deleteButton, { backgroundColor: isSelected ? 'rgba(255,255,255,0.2)' : theme.colors.surface }]}
                      onPress={(e) => {
                        e.stopPropagation();
                        handleDeleteCategory(category);
                      }}
                      disabled={disabled}
                    >
                      <Text style={[styles.deleteButtonText, { color: isSelected ? '#FFFFFF' : theme.colors.error }]}>
                        🗑️
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
          </View>
        </ScrollView>
        
        {/* Özel Scroll Indicator */}
        {scrollIndicatorVisible && (
          <View style={[styles.scrollIndicatorContainer, { backgroundColor: 'transparent' }]}>
            <View style={[styles.scrollIndicatorTrack, { backgroundColor: theme.colors.border + '40' }]}>
              <Animated.View
                style={[
                  styles.scrollIndicatorThumb,
                  {
                    backgroundColor: theme.colors.primary,
                    height: scrollThumbHeight,
                    transform: [
                      {
                        translateY: scrollY,
                      },
                    ],
                  },
                ]}
              />
            </View>
          </View>
        )}
      </View>

      {/* Süre Düzenleme Modal */}
      <Modal
        visible={editingCategory !== null}
        transparent={true}
        animationType="fade"
        onRequestClose={() => {
          setEditingCategory(null);
          setHours(0);
          setMinutes(25);
          setSeconds(0);
        }}
      >
        <View style={[styles.modalOverlay, { backgroundColor: theme.colors.shadow + 'CC' }]}>
          <View style={[styles.modalContent, { backgroundColor: theme.colors.card }]}>
            <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
              {editingCategory?.name} Süresini Ayarla
            </Text>
            
            {/* Time Picker */}
            <View style={styles.timePickerContainer}>
              {/* Saat */}
              <View style={styles.timePickerColumn}>
                <Text style={[styles.timePickerLabel, { color: theme.colors.textSecondary }]}>Saat</Text>
                <ScrollView
                  ref={hoursScrollRef}
                  style={[styles.timePickerScroll, { 
                    backgroundColor: theme.colors.surface,
                    borderColor: theme.colors.border,
                  }]}
                  showsVerticalScrollIndicator={false}
                  snapToInterval={50}
                  decelerationRate="fast"
                >
                  {Array.from({ length: 24 }, (_, i) => i).map((h) => (
                    <TouchableOpacity
                      key={h}
                      style={[
                        styles.timePickerItem,
                        {
                          backgroundColor: hours === h ? (editingCategory?.color || theme.colors.primary) : 'transparent',
                        },
                      ]}
                      onPress={() => setHours(h)}
                    >
                      <Text
                        style={[
                          styles.timePickerItemText,
                          {
                            color: hours === h ? '#FFFFFF' : theme.colors.text,
                            fontWeight: hours === h ? '700' : '500',
                          },
                        ]}
                      >
                        {h.toString().padStart(2, '0')}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* Dakika */}
              <View style={styles.timePickerColumn}>
                <Text style={[styles.timePickerLabel, { color: theme.colors.textSecondary }]}>Dakika</Text>
                <ScrollView
                  ref={minutesScrollRef}
                  style={[styles.timePickerScroll, { 
                    backgroundColor: theme.colors.surface,
                    borderColor: theme.colors.border,
                  }]}
                  showsVerticalScrollIndicator={false}
                  snapToInterval={50}
                  decelerationRate="fast"
                >
                  {Array.from({ length: 60 }, (_, i) => i).map((m) => (
                    <TouchableOpacity
                      key={m}
                      style={[
                        styles.timePickerItem,
                        {
                          backgroundColor: minutes === m ? (editingCategory?.color || theme.colors.primary) : 'transparent',
                        },
                      ]}
                      onPress={() => setMinutes(m)}
                    >
                      <Text
                        style={[
                          styles.timePickerItemText,
                          {
                            color: minutes === m ? '#FFFFFF' : theme.colors.text,
                            fontWeight: minutes === m ? '700' : '500',
                          },
                        ]}
                      >
                        {m.toString().padStart(2, '0')}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* Saniye */}
              <View style={styles.timePickerColumn}>
                <Text style={[styles.timePickerLabel, { color: theme.colors.textSecondary }]}>Saniye</Text>
                <ScrollView
                  ref={secondsScrollRef}
                  style={[styles.timePickerScroll, { 
                    backgroundColor: theme.colors.surface,
                    borderColor: theme.colors.border,
                  }]}
                  showsVerticalScrollIndicator={false}
                  snapToInterval={50}
                  decelerationRate="fast"
                >
                  {Array.from({ length: 60 }, (_, i) => i).map((s) => (
                    <TouchableOpacity
                      key={s}
                      style={[
                        styles.timePickerItem,
                        {
                          backgroundColor: seconds === s ? (editingCategory?.color || theme.colors.primary) : 'transparent',
                        },
                      ]}
                      onPress={() => setSeconds(s)}
                    >
                      <Text
                        style={[
                          styles.timePickerItemText,
                          {
                            color: seconds === s ? '#FFFFFF' : theme.colors.text,
                            fontWeight: seconds === s ? '700' : '500',
                          },
                        ]}
                      >
                        {s.toString().padStart(2, '0')}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>

            {/* Toplam Süre Gösterimi */}
            <View style={[styles.totalDurationContainer, { backgroundColor: theme.colors.surface }]}>
              <Text style={[styles.totalDurationLabel, { color: theme.colors.textSecondary }]}>
                Toplam Süre:
              </Text>
              <Text style={[styles.totalDurationValue, { color: editingCategory?.color || theme.colors.primary }]}>
                {hours > 0 ? `${hours} saat ` : ''}
                {minutes > 0 ? `${minutes} dakika ` : ''}
                {seconds > 0 ? `${seconds} saniye` : ''}
                {hours === 0 && minutes === 0 && seconds === 0 ? '0 dakika' : ''}
              </Text>
            </View>

            <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton, { 
                    backgroundColor: 'transparent',
                    borderColor: theme.colors.error,
                  }]}
                  onPress={() => {
                    setEditingCategory(null);
                    setDurationValue('');
                    setHours(0);
                    setMinutes(25);
                    setSeconds(0);
                  }}
                >
                  <Text style={[styles.modalButtonText, { color: theme.colors.error }]}>İptal</Text>
                </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton, { backgroundColor: editingCategory?.color || theme.colors.primary }]}
                onPress={handleSaveDuration}
              >
                <Text style={styles.modalButtonText}>Kaydet</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Yeni Kategori Ekleme Modal */}
      <Modal
        visible={showAddModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={[styles.modalOverlay, { backgroundColor: theme.colors.shadow + 'CC' }]}>
          <ScrollView 
            contentContainerStyle={styles.modalScrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={[styles.modalContent, styles.addModalContent, { backgroundColor: theme.colors.card }]}>
              <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
                Yeni Kategori Ekle
              </Text>
              
              <Text style={[styles.inputLabel, { color: theme.colors.text }]}>Kategori Adı:</Text>
              <TextInput
                style={[styles.textInput, { 
                  backgroundColor: theme.colors.surface,
                  color: theme.colors.text,
                  borderColor: theme.colors.border,
                }]}
                value={newCategoryName}
                onChangeText={setNewCategoryName}
                placeholder="Örn: Spor, Müzik..."
                placeholderTextColor={theme.colors.textSecondary}
              />

              <Text style={[styles.inputLabel, { color: theme.colors.text }]}>Süre (dakika):</Text>
              <TextInput
                style={[styles.textInput, { 
                  backgroundColor: theme.colors.surface,
                  color: theme.colors.text,
                  borderColor: theme.colors.border,
                }]}
                value={newCategoryDuration}
                onChangeText={setNewCategoryDuration}
                keyboardType="numeric"
                placeholder="25"
                placeholderTextColor={theme.colors.textSecondary}
              />

              <Text style={[styles.inputLabel, { color: theme.colors.text }]}>İkon Seç:</Text>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                style={styles.iconScroll}
              >
                {iconOptions.map((icon) => (
                  <TouchableOpacity
                    key={icon}
                    style={[
                      styles.iconOption,
                      {
                        backgroundColor: newCategoryIcon === icon ? theme.colors.primary : theme.colors.surface,
                        borderColor: theme.colors.border,
                      },
                    ]}
                    onPress={() => setNewCategoryIcon(icon)}
                  >
                    <Text style={styles.iconOptionText}>{icon}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton, { 
                    backgroundColor: 'transparent',
                    borderColor: theme.colors.error,
                  }]}
                  onPress={() => {
                    setShowAddModal(false);
                    setNewCategoryName('');
                    setNewCategoryDuration('25');
                    setNewCategoryIcon('📝');
                  }}
                >
                  <Text style={[styles.modalButtonText, { color: theme.colors.error }]}>İptal</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.saveButton, { backgroundColor: theme.colors.primary }]}
                  onPress={handleAddCategory}
                >
                  <Text style={styles.modalButtonText}>Ekle</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 20,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  label: {
    fontSize: 18,
    fontWeight: '700',
  },
  addButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  scrollContainer: {
    position: 'relative',
    maxHeight: 300,
  },
  categoriesScroll: {
    maxHeight: 300,
  },
  scrollContent: {
    paddingRight: 20,
  },
  scrollIndicatorContainer: {
    position: 'absolute',
    right: 2,
    top: 0,
    bottom: 0,
    width: 6,
    justifyContent: 'flex-start',
    paddingVertical: 4,
  },
  scrollIndicatorTrack: {
    width: 6,
    height: '100%',
    borderRadius: 3,
    overflow: 'hidden',
  },
  scrollIndicatorThumb: {
    width: 6,
    minHeight: 40,
    borderRadius: 3,
    position: 'absolute',
    top: 0,
  },
  categoriesContainer: {
    gap: 12,
  },
  categoryCard: {
    width: '100%',
    borderRadius: 16,
    borderWidth: 2,
    padding: 16,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  categoryContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  categoryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  icon: {
    fontSize: 28,
    marginRight: 12,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryText: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  durationText: {
    fontSize: 13,
    fontWeight: '500',
  },
  categoryActions: {
    flexDirection: 'row',
    gap: 8,
  },
  editButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editButtonText: {
    fontSize: 16,
  },
  deleteButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButtonText: {
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalScrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  modalContent: {
    borderRadius: 20,
    padding: 20,
    width: '100%',
    maxWidth: 320,
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 16,
  },
  addModalContent: {
    maxWidth: 300,
    padding: 16,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 20,
    textAlign: 'center',
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 12,
  },
  textInput: {
    borderWidth: 2,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    fontWeight: '500',
  },
  durationInput: {
    borderWidth: 2,
    borderRadius: 12,
    padding: 16,
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 20,
    textAlign: 'center',
  },
  timePickerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 20,
    gap: 12,
  },
  timePickerColumn: {
    flex: 1,
    alignItems: 'center',
  },
  timePickerLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  timePickerScroll: {
    height: 200,
    borderRadius: 12,
    borderWidth: 2,
  },
  timePickerItem: {
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    marginVertical: 2,
    marginHorizontal: 4,
  },
  timePickerItemText: {
    fontSize: 20,
    fontWeight: '500',
  },
  totalDurationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    gap: 8,
  },
  totalDurationLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  totalDurationValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  iconScroll: {
    marginVertical: 12,
  },
  iconOption: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  iconOptionText: {
    fontSize: 24,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButton: {
    borderWidth: 2,
  },
  saveButton: {
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  modalButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});

export default CategorySelector;
