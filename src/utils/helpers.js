// Saniyeyi dakika:saniye formatına çevir
export const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

// Saniyeyi dakikaya çevir
export const secondsToMinutes = (seconds) => {
  return Math.floor(seconds / 60);
};

// Tarihi formatla
export const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('tr-TR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

// Bugünün başlangıcını al
export const getTodayStart = () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
};

// Son N günün tarihlerini al
export const getLastNDays = (n) => {
  const days = [];
  for (let i = n - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    date.setHours(0, 0, 0, 0);
    days.push(date);
  }
  return days;
};

