import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Device kontrolü için basit bir kontrol
const isDevice = Platform.OS !== 'web';

// Bildirim handler'ı ayarla
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// Bildirim izinlerini al
export const registerForPushNotificationsAsync = async () => {
  let token;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  if (isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      console.log('Bildirim izni verilmedi!');
      return null;
    }
  } else {
    console.log('Fiziksel cihaz gerekli!');
  }

  return token;
};

// Zamanlanmış bildirim oluştur
export const scheduleNotification = async (noteId, title, body, date) => {
  try {
    const notificationDate = new Date(date);
    const now = new Date();

    // Geçmiş bir tarihse bildirim oluşturma
    if (notificationDate <= now) {
      console.log('Geçmiş tarih için bildirim oluşturulamaz');
      return null;
    }

    // Mevcut bildirimleri kontrol et ve varsa iptal et
    await cancelNotification(noteId);

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: title || 'Not Hatırlatıcı',
        body: body || 'Notunuzun zamanı geldi!',
        sound: true,
        data: { noteId },
      },
      trigger: {
        date: notificationDate,
      },
    });

    console.log('Bildirim zamanlandı:', notificationId, 'Tarih:', notificationDate);
    return notificationId;
  } catch (error) {
    console.error('Bildirim zamanlama hatası:', error);
    return null;
  }
};

// Bildirimi iptal et
export const cancelNotification = async (notificationId) => {
  try {
    if (notificationId) {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
      console.log('Bildirim iptal edildi:', notificationId);
    }
  } catch (error) {
    console.error('Bildirim iptal hatası:', error);
  }
};

// Tüm zamanlanmış bildirimleri getir
export const getAllScheduledNotifications = async () => {
  try {
    return await Notifications.getAllScheduledNotificationsAsync();
  } catch (error) {
    console.error('Bildirimler getirilirken hata:', error);
    return [];
  }
};

// Tüm bildirimleri temizle
export const cancelAllNotifications = async () => {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    console.log('Tüm bildirimler iptal edildi');
  } catch (error) {
    console.error('Bildirimler iptal edilirken hata:', error);
  }
};

