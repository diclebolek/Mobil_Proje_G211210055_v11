import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  AppState,
  ScrollView,
} from 'react-native';
import Timer from '../components/Timer';
import CategorySelector from '../components/CategorySelector';
import SessionSummary from '../components/SessionSummary';
import ThemeToggle from '../components/ThemeToggle';
import { useTheme } from '../hooks/useTheme';
import { saveSession, getSettings, saveSettings, getCustomCategories } from '../storage/storage';
import { CATEGORIES, DEFAULT_DURATION } from '../utils/constants';

const HomeScreen = () => {
  const { theme } = useTheme();
  const [seconds, setSeconds] = useState(DEFAULT_DURATION * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [distractions, setDistractions] = useState(0);
  const [showSummary, setShowSummary] = useState(false);
  const [sessionData, setSessionData] = useState(null);
  const [duration, setDuration] = useState(DEFAULT_DURATION);
  const [wasInBackground, setWasInBackground] = useState(false);
  const [categoryDurations, setCategoryDurations] = useState({});
  const [allCategories, setAllCategories] = useState([...CATEGORIES]);

  const intervalRef = useRef(null);
  const appState = useRef(AppState.currentState);
  const initialSecondsRef = useRef(DEFAULT_DURATION * 60);
  const sessionStartTimeRef = useRef(null);

  // Ayarları yükle
  useEffect(() => {
    loadSettings();
  }, []);

  // AppState dinleyicisi
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        // Uygulamaya geri dönüldü
        if (isRunning && !isPaused) {
          setWasInBackground(true);
          handlePause();
        }
      } else if (
        appState.current === 'active' &&
        nextAppState.match(/inactive|background/)
      ) {
        // Uygulamadan çıkıldı
        if (isRunning && !isPaused) {
          setDistractions((prev) => prev + 1);
          handlePause();
        }
      }

      appState.current = nextAppState;
    });

    return () => {
      subscription?.remove();
    };
  }, [isRunning, isPaused]);

  // Zamanlayıcı mantığı
  useEffect(() => {
    if (isRunning && !isPaused && seconds > 0) {
      intervalRef.current = setInterval(() => {
        setSeconds((prev) => {
          if (prev <= 1) {
            handleTimerComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, isPaused, seconds]);

  const loadSettings = async () => {
    const settings = await getSettings();
    const dur = settings.duration || DEFAULT_DURATION;
    setDuration(dur);
    setSeconds(dur * 60);
    initialSecondsRef.current = dur * 60;
    
    // Custom kategorileri yükle
    const customCategories = await getCustomCategories();
    
    // Gizlenen kategorileri filtrele
    const hiddenCategories = settings.hiddenCategories || [];
    const visibleDefault = CATEGORIES.filter((cat) => !hiddenCategories.includes(cat.id));
    setAllCategories([...visibleDefault, ...customCategories]);
    
    if (settings.categoryDurations) {
      setCategoryDurations(settings.categoryDurations);
      // Kategori sürelerini güncelle
      const allCats = [...visibleDefault, ...customCategories];
      Object.keys(settings.categoryDurations).forEach((categoryId) => {
        const category = allCats.find((cat) => cat.id === categoryId);
        if (category) {
          category.defaultDuration = settings.categoryDurations[categoryId];
        }
      });
    }
  };

  const handleCategorySelect = (category) => {
    if (category && !isRunning) {
      const categoryDuration = categoryDurations[category.id] || category.defaultDuration;
      setDuration(categoryDuration);
      setSeconds(categoryDuration * 60);
      initialSecondsRef.current = categoryDuration * 60;
    }
  };

  const handleCategoryDurationChange = (categoryId, newDuration) => {
    setCategoryDurations((prev) => ({
      ...prev,
      [categoryId]: newDuration,
    }));
    
    // Seçili kategori ise süreyi güncelle
    if (selectedCategory === categoryId && !isRunning) {
      setDuration(newDuration);
      setSeconds(newDuration * 60);
      initialSecondsRef.current = newDuration * 60;
    }
  };

  const handleStart = () => {
    if (!selectedCategory) {
      Alert.alert('Uyarı', 'Lütfen bir kategori seçiniz.');
      return;
    }

    setIsRunning(true);
    setIsPaused(false);
    setDistractions(0);
    sessionStartTimeRef.current = Date.now();
    initialSecondsRef.current = seconds;
  };

  const handleTimerToggle = () => {
    if (!selectedCategory) {
      Alert.alert('Uyarı', 'Lütfen bir kategori seçiniz.');
      return;
    }

    if (!isRunning && !isPaused) {
      // Başlat
      handleStart();
    } else if (isRunning && !isPaused) {
      // Duraklat
      handlePause();
    } else if (isPaused) {
      // Devam et
      handleResume();
    }
  };

  const handlePause = () => {
    setIsPaused(true);
    setIsRunning(false);
  };

  const handleResume = () => {
    if (wasInBackground) {
      Alert.alert(
        'Dikkat Dağınıklığı',
        'Uygulamadan ayrıldığınız tespit edildi. Seansa devam etmek istiyor musunuz?',
        [
          {
            text: 'Hayır',
            style: 'cancel',
            onPress: () => {
              setWasInBackground(false);
              handleStop();
            },
          },
          {
            text: 'Evet',
            onPress: () => {
              setWasInBackground(false);
              setIsPaused(false);
              setIsRunning(true);
            },
          },
        ]
      );
    } else {
      setIsPaused(false);
      setIsRunning(true);
    }
  };

  const handleStop = async () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    const elapsedSeconds = initialSecondsRef.current - seconds;
    const actualDuration = Math.floor(elapsedSeconds / 60);

    // Duraklatıldığında veya bitirildiğinde o ana kadar geçen süreyi kaydet
    if (elapsedSeconds > 0 || distractions > 0) {
      const session = {
        category: selectedCategory || 'unknown',
        duration: elapsedSeconds,
        distractions: distractions,
        completed: seconds === 0,
      };

      await saveSession(session);
      setSessionData(session);
      setShowSummary(true);
    }

    setIsRunning(false);
    setIsPaused(false);
    setSeconds(initialSecondsRef.current);
    setDistractions(0);
    setSelectedCategory(null);
    sessionStartTimeRef.current = null;
  };

  const handleReset = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    setIsRunning(false);
    setIsPaused(false);
    setSeconds(initialSecondsRef.current);
    setDistractions(0);
    setSelectedCategory(null);
    setWasInBackground(false);
  };

  const handleTimerComplete = async () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    const session = {
      category: selectedCategory || 'unknown',
      duration: initialSecondsRef.current,
      distractions: distractions,
      completed: true,
    };

    await saveSession(session);
    setSessionData(session);
    setShowSummary(true);

    setIsRunning(false);
    setIsPaused(false);
    setSeconds(initialSecondsRef.current);
    setDistractions(0);
    setSelectedCategory(null);
  };

  const handleDurationChange = async (change) => {
    const newDuration = Math.max(1, Math.min(120, duration + change));
    setDuration(newDuration);
    setSeconds(newDuration * 60);
    initialSecondsRef.current = newDuration * 60;
    await saveSettings({ duration: newDuration });
  };

  const selectedCategoryData = allCategories.find((cat) => cat.id === selectedCategory);
  const currentCategoryDuration = selectedCategoryData 
    ? (categoryDurations[selectedCategory] || selectedCategoryData.defaultDuration)
    : duration;

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.header, { backgroundColor: theme.colors.background }]}>
        <Text style={[styles.appTitle, { color: theme.colors.primary }]}>FocusFlow</Text>
        <ThemeToggle />
      </View>
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          {/* Dikkat Dağınıklığı Uyarısı - Timer'ın üstünde */}
          {distractions > 0 && (
            <View style={[styles.distractionInfo, { 
              backgroundColor: theme.colors.warning + '20',
              borderColor: theme.colors.warning,
            }]}>
              <Text style={[styles.distractionText, { color: theme.colors.warning }]}>
                ⚠️ Dikkat Dağınıklığı: {distractions} kez
              </Text>
            </View>
          )}

          <Timer 
            seconds={seconds} 
            isRunning={isRunning} 
            isPaused={isPaused}
            onPress={handleTimerToggle}
          />

          {/* Butonlar - Timer'ın altında */}
          <View style={styles.timerButtonsContainer}>
            {!isRunning && !isPaused && (
              <>
                <TouchableOpacity 
                  style={[styles.startButton, { 
                    borderColor: theme.colors.success,
                    backgroundColor: 'transparent',
                  }]} 
                  onPress={handleStart}
                >
                  <Text style={[styles.startButtonText, { color: theme.colors.success }]}>
                    ▶️ Başlat
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.resetButton, { 
                    borderColor: theme.colors.error,
                    backgroundColor: 'transparent',
                  }]} 
                  onPress={handleReset}
                >
                  <Text style={[styles.resetButtonText, { color: theme.colors.error }]}>
                    Sıfırla
                  </Text>
                </TouchableOpacity>
              </>
            )}

            {isRunning && !isPaused && (
              <>
                <TouchableOpacity 
                  style={[styles.pauseButton, { 
                    borderColor: theme.colors.warning,
                    backgroundColor: 'transparent',
                  }]} 
                  onPress={handlePause}
                >
                  <Text style={[styles.pauseButtonText, { color: theme.colors.warning }]}>
                    ⏸️ Duraklat
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.resetButton, { 
                    borderColor: theme.colors.error,
                    backgroundColor: 'transparent',
                  }]} 
                  onPress={handleReset}
                >
                  <Text style={[styles.resetButtonText, { color: theme.colors.error }]}>
                    Sıfırla
                  </Text>
                </TouchableOpacity>
              </>
            )}

            {isPaused && (
              <>
                <TouchableOpacity
                  style={[styles.resumeButton, { 
                    borderColor: theme.colors.warning,
                    backgroundColor: 'transparent',
                  }]}
                  onPress={handleResume}
                >
                  <Text style={[styles.resumeButtonText, { color: theme.colors.warning }]}>
                    Duraklatıldı
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.resetButton, { 
                    borderColor: theme.colors.error,
                    backgroundColor: 'transparent',
                  }]} 
                  onPress={handleReset}
                >
                  <Text style={[styles.resetButtonText, { color: theme.colors.error }]}>
                    Sıfırla
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.finishButton, { 
                    borderColor: theme.colors.primary,
                    backgroundColor: 'transparent',
                  }]} 
                  onPress={handleStop}
                >
                  <Text style={[styles.finishButtonText, { color: theme.colors.primary }]}>
                    Bitir
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </View>

          <View style={[styles.durationControl, { backgroundColor: theme.colors.surface }]}>
            <TouchableOpacity
              style={[styles.durationButton, { 
                backgroundColor: theme.colors.primary,
                opacity: isRunning ? 0.5 : 1,
              }]}
              onPress={() => handleDurationChange(-5)}
              disabled={isRunning}
            >
              <Text style={styles.durationButtonText}>-5</Text>
            </TouchableOpacity>
            <View style={styles.durationTextContainer}>
              <Text style={[styles.durationText, { color: theme.colors.text }]}>
                {duration} dakika
              </Text>
              {selectedCategoryData && (
                <Text style={[styles.categoryHint, { color: theme.colors.textSecondary }]}>
                  {selectedCategoryData.name} için önerilen: {currentCategoryDuration} dk
                </Text>
              )}
            </View>
            <TouchableOpacity
              style={[styles.durationButton, { 
                backgroundColor: theme.colors.primary,
                opacity: isRunning ? 0.5 : 1,
              }]}
              onPress={() => handleDurationChange(5)}
              disabled={isRunning}
            >
              <Text style={styles.durationButtonText}>+5</Text>
            </TouchableOpacity>
          </View>

          <CategorySelector
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
            onCategorySelect={handleCategorySelect}
            onDurationChange={handleCategoryDurationChange}
            onCategoriesChange={setAllCategories}
            disabled={isRunning}
          />
        </View>
      </ScrollView>

      <SessionSummary
        visible={showSummary}
        session={sessionData}
        onClose={() => setShowSummary(false)}
      />
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  content: {
    padding: 20,
  },
  timerButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    marginTop: 10,
    marginBottom: 20,
  },
  startButton: {
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 25,
    borderWidth: 2,
    alignItems: 'center',
    minWidth: 140,
  },
  startButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
  pauseButton: {
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 25,
    borderWidth: 2,
    alignItems: 'center',
    minWidth: 140,
  },
  pauseButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
  resumeButton: {
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 25,
    borderWidth: 2,
    alignItems: 'center',
    minWidth: 140,
  },
  resumeButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
  resetButton: {
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 25,
    borderWidth: 2,
    alignItems: 'center',
    minWidth: 100,
  },
  resetButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
  finishButton: {
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 25,
    borderWidth: 2,
    alignItems: 'center',
    minWidth: 100,
  },
  finishButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
  durationControl: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 20,
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  durationButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  durationButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  durationTextContainer: {
    alignItems: 'center',
    minWidth: 120,
  },
  durationText: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  categoryHint: {
    fontSize: 11,
    marginTop: 4,
    textAlign: 'center',
  },
  distractionInfo: {
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
    alignItems: 'center',
    borderWidth: 2,
    alignSelf: 'center',
    minWidth: 200,
  },
  distractionText: {
    fontSize: 14,
    fontWeight: '600',
  },
});

export default HomeScreen;
