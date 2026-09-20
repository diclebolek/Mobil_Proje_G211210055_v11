// SQLite veritabanı kullanıyoruz
import * as db from '../database/database';

// Veritabanını başlat
export const initDatabase = db.initDatabase;

// Seans verilerini kaydet
export const saveSession = async (session) => {
  try {
    await db.saveSession({
      ...session,
      id: session.id || Date.now().toString(),
      date: session.date || new Date().toISOString(),
    });
    return true;
  } catch (error) {
    console.error('Seans kaydedilirken hata:', error);
    return false;
  }
};

// Tüm seansları getir
export const getSessions = async () => {
  try {
    return await db.getSessions();
  } catch (error) {
    console.error('Seanslar okunurken hata:', error);
    return [];
  }
};

// Ayarları kaydet
export const saveSettings = async (settings) => {
  try {
    await db.saveSettings(settings);
    return true;
  } catch (error) {
    console.error('Ayarlar kaydedilirken hata:', error);
    return false;
  }
};

// Ayarları getir
export const getSettings = async () => {
  try {
    return await db.getSettings();
  } catch (error) {
    console.error('Ayarlar okunurken hata:', error);
    return { duration: 25 };
  }
};

// Özel kategorileri kaydet
export const saveCustomCategories = async (categories) => {
  try {
    await db.saveCustomCategories(categories);
    return true;
  } catch (error) {
    console.error('Kategoriler kaydedilirken hata:', error);
    return false;
  }
};

// Özel kategorileri getir
export const getCustomCategories = async () => {
  try {
    return await db.getCustomCategories();
  } catch (error) {
    console.error('Kategoriler okunurken hata:', error);
    return [];
  }
};

// Belirli bir tarih aralığındaki seansları getir
export const getSessionsByDateRange = async (startDate, endDate) => {
  try {
    return await db.getSessionsByDateRange(startDate, endDate);
  } catch (error) {
    console.error('Tarih aralığı seansları okunurken hata:', error);
    return [];
  }
};

// Not kaydet
export const saveNote = async (note) => {
  try {
    await db.saveNote({
      ...note,
      id: note.id || Date.now().toString(),
      date: note.date || new Date().toISOString(),
    });
    return true;
  } catch (error) {
    console.error('Not kaydedilirken hata:', error);
    return false;
  }
};

// Tüm notları getir
export const getNotes = async () => {
  try {
    return await db.getNotes();
  } catch (error) {
    console.error('Notlar okunurken hata:', error);
    return [];
  }
};

// Belirli bir seansa ait notları getir
export const getNotesBySessionId = async (sessionId) => {
  try {
    return await db.getNotesBySessionId(sessionId);
  } catch (error) {
    console.error('Seans notları okunurken hata:', error);
    return [];
  }
};

// Not sil
export const deleteNote = async (noteId) => {
  try {
    await db.deleteNote(noteId);
    return true;
  } catch (error) {
    console.error('Not silinirken hata:', error);
    return false;
  }
};

// Not ara
export const searchNotes = async (searchText) => {
  try {
    return await db.searchNotes(searchText);
  } catch (error) {
    console.error('Not aranırken hata:', error);
    return [];
  }
};