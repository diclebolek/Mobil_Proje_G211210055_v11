# Odaklanma Takibi ve Raporlama Uygulaması

React Native (Expo) ile geliştirilmiş dijital dikkat dağınıklığıyla mücadele uygulaması.

## Özellikler

- ⏱️ **Pomodoro Tekniği Zamanlayıcı**: 25 dakika (ayarlanabilir) odaklanma seansları
- 📊 **Dikkat Dağınıklığı Takibi**: AppState API ile uygulamadan çıkışları otomatik tespit
- 📈 **Detaylı Raporlar**: Günlük ve genel istatistikler
- 📉 **Görsel Grafikler**: Son 7 gün çubuk grafik ve kategori dağılımı pasta grafik
- 🏷️ **Kategori Sistemi**: Ders Çalışma, Kodlama, Proje, Kitap Okuma, Diğer

## Kurulum

1. Bağımlılıkları yükleyin:
```bash
npm install
```

2. Uygulamayı başlatın:
```bash
npm start
```

3. iOS veya Android emülatöründe çalıştırın:
```bash
npm run ios
# veya
npm run android
```

## Proje Yapısı

```
ProjeeMobil/
├── App.js                 # Ana uygulama ve navigasyon
├── src/
│   ├── screens/           # Ekranlar
│   │   ├── HomeScreen.js  # Zamanlayıcı ekranı
│   │   └── ReportsScreen.js # Raporlar ekranı
│   ├── components/        # Bileşenler
│   │   ├── Timer.js       # Zamanlayıcı görünümü
│   │   ├── CategorySelector.js # Kategori seçici
│   │   └── SessionSummary.js   # Seans özeti modal
│   ├── storage/           # Veri depolama
│   │   └── storage.js     # AsyncStorage işlemleri
│   └── utils/             # Yardımcı fonksiyonlar
│       ├── constants.js   # Sabitler
│       └── helpers.js     # Yardımcı fonksiyonlar
├── package.json
└── app.json
```

## Kullanım

### Zamanlayıcı Ekranı

1. Süreyi ayarlayın (+5/-5 butonları ile)
2. Bir kategori seçin
3. "Başlat" butonuna tıklayın
4. Uygulamadan çıktığınızda otomatik olarak duraklatılır ve dikkat dağınıklığı sayılır
5. Seans bittiğinde veya durdurulduğunda özet gösterilir

### Raporlar Ekranı

- Bugün toplam odaklanma süresi
- Tüm zamanların toplam odaklanma süresi
- Toplam dikkat dağınıklığı sayısı
- Son 7 gün odaklanma süresi grafiği
- Kategori dağılımı pasta grafiği

## Teknolojiler

- React Native (Expo)
- React Navigation (Bottom Tabs)
- AsyncStorage (Veri depolama)
- React Native Chart Kit (Grafikler)
- AppState API (Dikkat dağınıklığı takibi)

## Gereksinimler

- Node.js 14+
- Expo CLI
- iOS Simulator veya Android Emulator (veya fiziksel cihaz)

## Lisans

Bu proje eğitim amaçlı geliştirilmiştir.

