import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { BarChart, PieChart } from 'react-native-chart-kit';
import { Dimensions } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../hooks/useTheme';
import ThemeToggle from '../components/ThemeToggle';
import { getSessions, getCustomCategories, getSettings } from '../storage/storage';
import { CATEGORIES } from '../utils/constants';
import {
  getTodayStart,
  getLastNDays,
  secondsToMinutes,
} from '../utils/helpers';

const screenWidth = Dimensions.get('window').width;

const ReportsScreen = () => {
  const { theme } = useTheme();
  const [sessions, setSessions] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    todayTotal: 0,
    allTimeTotal: 0,
    totalDistractions: 0,
  });
  const [allCategories, setAllCategories] = useState([...CATEGORIES]);

  useEffect(() => {
    loadData();
    loadCategories();
  }, []);

  // Ekrana her odaklanıldığında verileri yeniden yükle
  useFocusEffect(
    React.useCallback(() => {
      loadData();
      loadCategories();
    }, [])
  );

  const loadCategories = async () => {
    const custom = await getCustomCategories();
    const settings = await getSettings();
    const hiddenCategories = settings.hiddenCategories || [];
    const visibleDefault = CATEGORIES.filter((cat) => !hiddenCategories.includes(cat.id));
    setAllCategories([...visibleDefault, ...custom]);
    
    // Grafikleri yeniden hesapla
    if (sessions.length > 0) {
      const newBarData = getLast7DaysData();
      const newPieData = getCategoryData();
      // useMemo otomatik güncellenecek
    }
  };

  const loadData = async () => {
    const allSessions = await getSessions();
    setSessions(allSessions);
    calculateStats(allSessions);
  };

  const calculateStats = (allSessions) => {
    if (!allSessions || allSessions.length === 0) {
      setStats({
        todayTotal: 0,
        allTimeTotal: 0,
        totalDistractions: 0,
      });
      return;
    }

    const todayStart = getTodayStart();
    const todaySessions = allSessions.filter((session) => {
      if (!session || !session.date) return false;
      const sessionDate = new Date(session.date);
      return sessionDate >= todayStart;
    });

    const todayTotal = todaySessions.reduce(
      (sum, session) => sum + (session.duration ? secondsToMinutes(session.duration) : 0),
      0
    );

    const allTimeTotal = allSessions.reduce(
      (sum, session) => sum + (session.duration ? secondsToMinutes(session.duration) : 0),
      0
    );

    const totalDistractions = allSessions.reduce(
      (sum, session) => sum + (session.distractions || 0),
      0
    );

    setStats({
      todayTotal,
      allTimeTotal,
      totalDistractions,
    });
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  // Son 7 gün için veri hazırla - useMemo ile optimize edildi
  const barData = useMemo(() => {
    const last7Days = getLastNDays(7);
    const data = last7Days.map((date) => {
      const daySessions = sessions.filter((session) => {
        if (!session || !session.date) return false;
        const sessionDate = new Date(session.date);
        return (
          sessionDate.getDate() === date.getDate() &&
          sessionDate.getMonth() === date.getMonth() &&
          sessionDate.getFullYear() === date.getFullYear()
        );
      });

      const totalMinutes = daySessions.reduce(
        (sum, session) => sum + (session.duration ? secondsToMinutes(session.duration) : 0),
        0
      );

      return totalMinutes;
    });

    return {
      labels: last7Days.map((date) => {
        const day = date.getDate();
        const month = date.getMonth() + 1;
        return `${day}/${month}`;
      }),
      datasets: [
        {
          data: data,
        },
      ],
    };
  }, [sessions]);

  // Kategori dağılımı verisi - useMemo ile optimize edildi
  const pieData = useMemo(() => {
    const categoryTotals = {};
    const categoryMap = {}; // Kategori ID'lerini kategori objelerine eşleştir

    // Tüm kategorileri (gizlenmiş olanlar dahil) dahil et
    const allCategoriesIncludingHidden = [...CATEGORIES];
    allCategories.forEach((category) => {
      if (!allCategoriesIncludingHidden.find(cat => cat.id === category.id)) {
        allCategoriesIncludingHidden.push(category);
      }
    });

    // Kategori map'i oluştur
    allCategoriesIncludingHidden.forEach((category) => {
      categoryTotals[category.id] = 0;
      categoryMap[category.id] = category;
    });

    // Session'lardaki kategorileri işle
    sessions.forEach((session) => {
      if (session && session.category && session.duration) {
        let categoryId = session.category;
        
        // 'unknown' kategorisini 'other' (Diğer) ile eşleştir
        if (categoryId === 'unknown') {
          categoryId = 'other';
        }
        
        // Eğer kategori bulunamazsa, 'other' (Diğer) kategorisine ekle
        if (!categoryMap[categoryId]) {
          categoryId = 'other';
        }
        
        if (categoryTotals[categoryId] !== undefined) {
          categoryTotals[categoryId] += secondsToMinutes(session.duration);
        }
      }
    });

    const total = Object.values(categoryTotals).reduce(
      (sum, val) => sum + val,
      0
    );

    if (total === 0) {
      return {
        labels: ['Veri Yok'],
        data: [1],
        colors: [theme.colors.textSecondary],
      };
    }

    const labels = [];
    const data = [];
    const colors = [];

    // Önce görünür kategorileri göster
    allCategories.forEach((category) => {
      const minutes = categoryTotals[category.id] || 0;
      if (minutes > 0) {
        labels.push(category.name);
        data.push(minutes);
        colors.push(category.color);
      }
    });

    // Sonra gizlenmiş ama verisi olan kategorileri ekle
    const hiddenCategories = allCategoriesIncludingHidden.filter(cat => 
      !allCategories.find(visibleCat => visibleCat.id === cat.id)
    );
    
    hiddenCategories.forEach((category) => {
      const minutes = categoryTotals[category.id] || 0;
      if (minutes > 0) {
        labels.push(category.name);
        data.push(minutes);
        colors.push(category.color);
      }
    });

    return { labels, data, colors };
  }, [sessions, allCategories, theme.colors.textSecondary]);

  const chartConfig = {
    backgroundColor: theme.colors.card,
    backgroundGradientFrom: theme.colors.card,
    backgroundGradientTo: theme.colors.card,
    decimalPlaces: 0,
    color: (opacity = 1) => {
      const rgb = theme.colors.primary.replace('#', '');
      const r = parseInt(rgb.substring(0, 2), 16);
      const g = parseInt(rgb.substring(2, 4), 16);
      const b = parseInt(rgb.substring(4, 6), 16);
      return `rgba(${r}, ${g}, ${b}, ${opacity})`;
    },
    labelColor: (opacity = 1) => {
      const rgb = theme.colors.text.replace('#', '');
      const r = parseInt(rgb.substring(0, 2), 16);
      const g = parseInt(rgb.substring(2, 4), 16);
      const b = parseInt(rgb.substring(4, 6), 16);
      return `rgba(${r}, ${g}, ${b}, ${opacity})`;
    },
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '6',
      strokeWidth: '2',
      stroke: theme.colors.warning,
    },
    propsForBackgroundLines: {
      strokeWidth: 1,
      stroke: theme.colors.border,
      strokeDasharray: '0',
    },
    barPercentage: 0.7,
    paddingLeft: 35,
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.header, { backgroundColor: theme.colors.background }]}>
        <Text style={[styles.appTitle, { color: theme.colors.primary }]}>FocusFlow</Text>
        <ThemeToggle />
      </View>
      
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            tintColor={theme.colors.primary}
          />
        }
      >
        <View style={styles.content}>
          {/* İstatistikler */}
          <View style={styles.statsContainer}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              Genel İstatistikler
            </Text>

            <View style={[styles.statCard, { 
              backgroundColor: theme.colors.card,
              shadowColor: theme.colors.shadow,
            }]}>
              <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
                Bugün Toplam Odaklanma Süresi
              </Text>
              <Text style={[styles.statValue, { color: theme.colors.primary }]}>
                {stats.todayTotal} dakika
              </Text>
            </View>

            <View style={[styles.statCard, { 
              backgroundColor: theme.colors.card,
              shadowColor: theme.colors.shadow,
            }]}>
              <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
                Tüm Zamanların Toplam Odaklanma Süresi
              </Text>
              <Text style={[styles.statValue, { color: theme.colors.primary }]}>
                {stats.allTimeTotal} dakika
              </Text>
            </View>

            <View style={[styles.statCard, { 
              backgroundColor: theme.colors.card,
              shadowColor: theme.colors.shadow,
            }]}>
              <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
                Toplam Dikkat Dağınıklığı Sayısı
              </Text>
              <Text style={[styles.statValue, { 
                color: stats.totalDistractions > 0 ? theme.colors.error : theme.colors.success 
              }]}>
                {stats.totalDistractions} kez
              </Text>
            </View>
          </View>

          {/* Son 7 Gün Grafiği */}
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Son 7 Gün Odaklanma Süresi
          </Text>
          <View style={[styles.chartContainer, { 
            backgroundColor: theme.colors.card,
            shadowColor: theme.colors.shadow,
          }]}>
            <View style={styles.barChartContainer}>
              <BarChart
                data={barData}
                width={screenWidth - 40}
                height={220}
                yAxisLabel=""
                yAxisSuffix=" dk"
                chartConfig={chartConfig}
                style={styles.chart}
                showValuesOnTopOfBars={true}
                fromZero={true}
                withInnerLines={true}
                withVerticalLabels={true}
                withHorizontalLabels={true}
                segments={4}
                verticalLabelRotation={0}
              />
            </View>
            <Text style={[styles.chartNote, { color: theme.colors.textSecondary }]}>
              * Tarih formatı: Gün/Ay (örn: 5/12 = 5 Aralık)
            </Text>
          </View>

          {/* Kategori Dağılımı Grafiği */}
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Kategori Dağılımı
          </Text>
          <View style={[styles.chartContainer, { 
            backgroundColor: theme.colors.card,
            shadowColor: theme.colors.shadow,
          }]}>
            {pieData.data.length > 0 && (
              <View style={styles.pieChartContainer}>
                <PieChart
                  data={pieData.data.map((value, index) => ({
                    name: pieData.labels[index],
                    value: value,
                    color: pieData.colors[index],
                    legendFontColor: theme.colors.textSecondary,
                    legendFontSize: 12,
                  }))}
                  width={screenWidth - 40}
                  height={220}
                  chartConfig={chartConfig}
                  accessor="value"
                  backgroundColor="transparent"
                  paddingLeft="15"
                  style={styles.chart}
                  absolute
                />
              </View>
            )}
            {pieData.data.length === 0 && (
              <View style={styles.noDataContainer}>
                <Text style={[styles.noDataText, { color: theme.colors.textSecondary }]}>
                  Henüz veri bulunmuyor
                </Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
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
  content: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 12,
    marginTop: 0,
  },
  statsContainer: {
    marginBottom: 20,
  },
  statCard: {
    padding: 20,
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
  statLabel: {
    fontSize: 14,
    marginBottom: 8,
    fontWeight: '500',
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700',
  },
  chartContainer: {
    borderRadius: 16,
    padding: 16,
    paddingLeft: 20,
    marginTop: 0,
    marginBottom: 16,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  barChartContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
    paddingLeft: 35,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
    marginLeft: -20,
  },
  pieChartContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  noDataContainer: {
    height: 220,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noDataText: {
    fontSize: 16,
  },
  chartNote: {
    fontSize: 11,
    fontStyle: 'italic',
    marginTop: 8,
    textAlign: 'center',
  },
});

export default ReportsScreen;
