import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useTheme } from '../hooks/useTheme';
import ThemeToggle from '../components/ThemeToggle';

const TECHNIQUES = [
  {
    id: 'pomodoro',
    name: 'Pomodoro Tekniği',
    icon: '🍅',
    duration: 25,
    breakDuration: 5,
    longBreakDuration: 15,
    cycles: 4,
    description:
      'En popüler odaklanma tekniği. 25 dakika çalışma, 5 dakika mola. 4 pomodoro sonrası 15-30 dakika uzun mola.',
    benefits: [
      'Zamanı daha iyi yönetir',
      'Dikkat dağınıklığını azaltır',
      'Yorgunluğu önler',
      'Üretkenliği artırır',
    ],
    tips: [
      'Telefonu sessize alın',
      'Sadece bir göreve odaklanın',
      'Mola sırasında ekrandan uzaklaşın',
      'Günlük hedef belirleyin (örn: 8 pomodoro)',
    ],
  },
  {
    id: 'flowtime',
    name: 'Flowtime Tekniği',
    icon: '🌊',
    duration: 90,
    breakDuration: 15,
    description:
      'Doğal odaklanma sürenize göre çalışın. 90 dakika çalışma, 15 dakika mola. Daha esnek bir yaklaşım.',
    benefits: [
      'Doğal ritminize uyum sağlar',
      'Derin odaklanma için ideal',
      'Yaratıcı işler için uygundur',
      'Daha uzun çalışma blokları',
    ],
    tips: [
      'Kendinizi zorlamayın',
      'Yorgun hissediyorsanız mola verin',
      'Çalışma süresini kaydedin',
      'En verimli saatlerinizi belirleyin',
    ],
  },
  {
    id: 'timeboxing',
    name: 'Time Boxing',
    icon: '📦',
    duration: 60,
    breakDuration: 10,
    description:
      'Her görevi belirli bir zaman kutusuna yerleştirin. 60 dakika çalışma, 10 dakika mola.',
    benefits: [
      'Görevleri sınırlandırır',
      'Mükemmeliyetçiliği önler',
      'Öncelik belirlemeyi kolaylaştırır',
      'Günlük planlama yapmanızı sağlar',
    ],
    tips: [
      'Günün başında plan yapın',
      'Gerçekçi süreler belirleyin',
      'Beklenmedik durumlar için tampon bırakın',
      'Tamamlanan görevleri işaretleyin',
    ],
  },
  {
    id: 'ultradian',
    name: 'Ultradian Rhythm',
    icon: '⏰',
    duration: 90,
    breakDuration: 20,
    description:
      'Vücudun doğal 90-120 dakikalık döngülerine dayanır. 90 dakika çalışma, 20 dakika mola.',
    benefits: [
      'Biyolojik ritme uyumlu',
      'Yüksek enerji seviyeleri',
      'Daha az yorgunluk',
      'Uzun vadeli sürdürülebilirlik',
    ],
    tips: [
      'Sabah saatlerini tercih edin',
      'Mola sırasında hareket edin',
      'Su içmeyi unutmayın',
      'Uyku düzeninize dikkat edin',
    ],
  },
  {
    id: '52-17',
    name: '52/17 Kuralı',
    icon: '⚡',
    duration: 52,
    breakDuration: 17,
    description:
      'Araştırmalara göre en verimli çalışma-aralık oranı. 52 dakika çalışma, 17 dakika mola.',
    benefits: [
      'Bilimsel olarak kanıtlanmış',
      'Yüksek verimlilik',
      'Yorgunluğu önler',
      'Uzun süreli odaklanma',
    ],
    tips: [
      'Mola sırasında tamamen dinlenin',
      'Telefon ve sosyal medyadan uzak durun',
      'Kısa yürüyüş yapın',
      'Derin nefes alın',
    ],
  },
  {
    id: 'custom',
    name: 'Özel Teknik',
    icon: '🎯',
    duration: 30,
    breakDuration: 10,
    description:
      'Kendi ihtiyaçlarınıza göre özelleştirilmiş çalışma tekniği. Süreleri kendiniz belirleyin.',
    benefits: [
      'Tamamen kişiselleştirilmiş',
      'Esnek yapı',
      'İhtiyaçlarınıza uygun',
      'Deneme-yanılma ile geliştirilebilir',
    ],
    tips: [
      'Farklı süreleri deneyin',
      'Hangi sürenin size uygun olduğunu bulun',
      'Günlük performansınızı takip edin',
      'Başarılı kombinasyonları kaydedin',
    ],
  },
];

const TechniquesScreen = () => {
  const { theme } = useTheme();
  const [selectedTechnique, setSelectedTechnique] = useState(null);

  const renderTechniqueCard = (technique) => {
    const isSelected = selectedTechnique?.id === technique.id;

    return (
      <TouchableOpacity
        key={technique.id}
        style={[
          styles.techniqueCard,
          {
            backgroundColor: theme.colors.card,
            shadowColor: theme.colors.shadow,
            borderColor: isSelected ? theme.colors.primary : theme.colors.border,
            borderWidth: isSelected ? 2 : 1,
          },
        ]}
        onPress={() =>
          setSelectedTechnique(isSelected ? null : technique)
        }
      >
        <View style={styles.techniqueHeader}>
          <Text style={styles.techniqueIcon}>{technique.icon}</Text>
          <View style={styles.techniqueHeaderText}>
            <Text style={[styles.techniqueName, { color: theme.colors.text }]}>
              {technique.name}
            </Text>
            <Text
              style={[
                styles.techniqueDuration,
                { color: theme.colors.textSecondary },
              ]}
            >
              {technique.duration} dk çalışma / {technique.breakDuration} dk mola
            </Text>
          </View>
        </View>
        {isSelected && (
          <View style={styles.techniqueDetails}>
            <Text
              style={[styles.techniqueDescription, { color: theme.colors.text }]}
            >
              {technique.description}
            </Text>

            <View style={styles.section}>
              <Text
                style={[styles.sectionTitle, { color: theme.colors.primary }]}
              >
                ✨ Faydaları
              </Text>
              {technique.benefits.map((benefit, index) => (
                <View key={index} style={styles.benefitItem}>
                  <Text style={[styles.bullet, { color: theme.colors.primary }]}>
                    •
                  </Text>
                  <Text
                    style={[styles.benefitText, { color: theme.colors.text }]}
                  >
                    {benefit}
                  </Text>
                </View>
              ))}
            </View>

            <View style={styles.section}>
              <Text
                style={[styles.sectionTitle, { color: theme.colors.primary }]}
              >
                💡 İpuçları
              </Text>
              {technique.tips.map((tip, index) => (
                <View key={index} style={styles.benefitItem}>
                  <Text style={[styles.bullet, { color: theme.colors.primary }]}>
                    •
                  </Text>
                  <Text style={[styles.benefitText, { color: theme.colors.text }]}>
                    {tip}
                  </Text>
                </View>
              ))}
            </View>

            {technique.cycles && (
              <View
                style={[
                  styles.cycleInfo,
                  { backgroundColor: theme.colors.primary + '20' },
                ]}
              >
                <Text
                  style={[styles.cycleInfoText, { color: theme.colors.primary }]}
                >
                  🔄 {technique.cycles} pomodoro sonrası{' '}
                  {technique.longBreakDuration} dakika uzun mola
                </Text>
              </View>
            )}
          </View>
        )}
      </TouchableOpacity>
    );
  };

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
          <Text style={[styles.pageTitle, { color: theme.colors.text }]}>
            Odaklanma Teknikleri
          </Text>
          <Text
            style={[styles.pageSubtitle, { color: theme.colors.textSecondary }]}
          >
            Size en uygun tekniği bulun ve verimliliğinizi artırın
          </Text>

          {TECHNIQUES.map((technique) => renderTechniqueCard(technique))}

          <View
            style={[
              styles.infoCard,
              {
                backgroundColor: theme.colors.card,
                shadowColor: theme.colors.shadow,
              },
            ]}
          >
            <Text style={[styles.infoTitle, { color: theme.colors.primary }]}>
              💭 Nasıl Seçmeliyim?
            </Text>
            <Text style={[styles.infoText, { color: theme.colors.text }]}>
              Her teknik farklı ihtiyaçlar için tasarlanmıştır. Kısa görevler için
              Pomodoro, derin çalışma için Flowtime, planlı çalışma için Time Boxing
              tercih edebilirsiniz. Farklı teknikleri deneyerek size en uygun olanı
              bulun.
            </Text>
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
  scrollContent: {
    paddingBottom: 20,
  },
  content: {
    padding: 20,
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 8,
  },
  pageSubtitle: {
    fontSize: 16,
    marginBottom: 24,
    lineHeight: 22,
  },
  techniqueCard: {
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
  techniqueHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  techniqueIcon: {
    fontSize: 40,
    marginRight: 16,
  },
  techniqueHeaderText: {
    flex: 1,
  },
  techniqueName: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  techniqueDuration: {
    fontSize: 14,
    fontWeight: '500',
  },
  techniqueDetails: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
  },
  techniqueDescription: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 20,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  benefitItem: {
    flexDirection: 'row',
    marginBottom: 8,
    paddingLeft: 4,
  },
  bullet: {
    fontSize: 20,
    marginRight: 12,
    lineHeight: 24,
  },
  benefitText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 24,
  },
  cycleInfo: {
    padding: 12,
    borderRadius: 12,
    marginTop: 8,
  },
  cycleInfoText: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  infoCard: {
    padding: 20,
    borderRadius: 16,
    marginTop: 8,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  infoTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 15,
    lineHeight: 24,
  },
});

export default TechniquesScreen;

